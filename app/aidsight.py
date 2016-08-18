from __future__ import print_function,division #python 3 style division makes the world suck less

import csv
import json
from operator import itemgetter
import os
import pickle

from flask import Flask, request, session, g, redirect, url_for, abort,render_template, flash, jsonify, make_response
from forms import SearchForm

from aidsight_search import *
from aidsight_util import *

with open('data/iati_urls_by_ref.pickle', 'rb') as f:
	iati_urls_by_ref = pickle.load(f)

app = Flask("AidSight")
app.root_path = os.path.dirname(os.path.abspath(__file__))
app.config.from_object('config')

@app.route('/')
def serve_index():
    return render_template('index.html',title='index')

#Main Search Page
@app.route('/search', methods=['GET', 'POST'])
def search():
    form = SearchForm(request.args, csrf_enabled=False)

    query=form.query.data

    if query is None or len(query.strip()) == 0:
      return render_template('search.html', title='Search', form=form)

    results = get_search_results(query)

    return render_template('search_results.html',
                           form=form, results=results, title='Search Results')

@app.route('/quality') #provides quality data to flask templates
def quality():
    try:
        data=get_quality(request.args.get('org'))
        return render_template('quality.html', record=data.to_dict())
    except AidsightError as e:
        return e.response


@app.route('/quality_new') #provides quality data to flask templates
def quality_new():
    try:
        data=get_quality(request.args.get('org'))
        return render_template('quality_new.html', record=data.to_dict())
    except AidsightError as e:
        return e.response

@app.route('/quality_data') #provides quality data to d3
def quality_data():
    try:
        return format_data(get_quality(request.args.get('org')), 'quality_data')
    except AidsightError as e:
        return e.response

@app.route('/quality_data_example') #hard coded result for org page
def quality_data_example():
    try:
        return format_data(get_quality('NO-BRC-971277882'), 'quality_data')
    except AidsightError as e:
        return e.response

@app.route('/benchmark_data')
def benchmark():
    with open('static/data/benchmark_data.csv') as f:
        return jsonify([row for row in csv.DictReader(f)])

@app.route('/infrastructure')
def infrastructure():
     return render_template('infrastructure.html',title='infrastructure')


if __name__ == '__main__':
  app.run(debug=True, threaded=True)
