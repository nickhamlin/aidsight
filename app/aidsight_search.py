from __future__ import print_function,division #python 3 style division makes the world suck less

import sys
import json
import math
import re
import pickle
import six

import requests
import numpy as np
import pandas as pd
import pymongo

from aidsight_util import AidsightError
from config import *
from graph_data import *

try:
    conn = pymongo.MongoClient('mongodb://%s:%s' % (mongodb_host, mongodb_port))
    db = conn.iati

    activities = db.activities
    organizations = db.organizations
except:
    pass

# Load the sector and policy marker data

def get_sector_activities(sectors, policy_markers, query_term):
    if sectors is not None:
        sectors = set(sectors)

    if policy_markers is not None:
        policy_markers = set(policy_markers)

    tokenized_term = set([
        item for item in re.split('[^a-z]+', query_term) if len(item) > 0
    ])

    matching_activity_keys = set()

    for activity_key, activity_node in six.iteritems(activity_nodes):
        if sectors is None or policy_markers is None:
            add_activity = True
        else:
            add_activity = False

            if 'sector' in activity_node:
                if len(sectors & set(activity_node['sector'])) > 0:
                    add_activity = True

            if 'policy_marker' in activity_node:
                if len(policy_markers & set(activity_node['policy_marker'])) > 0:
                    add_activity = True

            if 'description' in activity_node:
                if len(activity_node['description'] & tokenized_term) > 0:
                    add_activity = True
                elif activity_node['description_raw'].find(query_term) != -1:
                    add_activity = True

        if add_activity:
            matching_activity_keys.add(activity_key)

    return matching_activity_keys

def get_location_activities(location_query):
    matching_activity_keys = set()

    for activity_key, activity_node in six.iteritems(activity_nodes):
        if location_query is None:
            add_activity = True
        else:
            add_activity = False

            if 'location' in activity_node:
                for location in activity_node['location']:
                    if location.lower().find(location_query) != -1:
                        add_activity = True

            if 'recipient-country' in activity_node:
                if activity_node['recipient-country'].lower().find(location_query) != -1:
                    add_activity = True

            if 'description' in activity_node:
                if location_query in activity_node['description']:
                    add_activity = True
                elif activity_node['description_raw'].find(location_query) != -1:
                    add_activity = True

        if add_activity:
            matching_activity_keys.add(activity_key)

    return matching_activity_keys

def get_activity_keys(sectors, policy_markers, sector_query, location_query):
    sector_activities = get_sector_activities(sectors, policy_markers, sector_query)
    print('Sector activity count:', len(sector_activities), file=sys.stderr)

    if location_query is None:
        return sector_activities

    location_activities = get_location_activities(location_query)
    print('Location activity count:', len(location_activities), file=sys.stderr)

    overlapping_activities = sector_activities & location_activities
    print('Overlapping activity count:', len(overlapping_activities), file=sys.stderr)

    return overlapping_activities

def get_organization_relationships(sectors, policy_markers, sector_query, location_query, organization_query):

    # Check for what nodes would be valid

    allowed_nodes = set()

    if organization_query is not None:
        for name, keys in lookup_by_name_lower.iteritems():
            if name.find(organization_query) != -1:
                allowed_nodes |= keys

        print('Organization name match count:', organization_query, len(allowed_nodes), file=sys.stderr)

        if len(allowed_nodes) == 0:
            return set(), [], []

    # Check for what activities would be valid (ignoring node restrictions)

    matching_activity_keys = get_activity_keys(sectors, policy_markers, sector_query, location_query)

    # Convert the activity keys into edges

    matching_nodes = set()
    matching_edges = {}
    matching_neighbors = {}

    for activity_key in matching_activity_keys:
        for edge in activity_relationships[activity_key]:
            start = edge['start']
            end = edge['end']

            # Filter by organization name

            if len(allowed_nodes) > 0 and start not in allowed_nodes and end not in allowed_nodes:
                continue

            # Add the node to the set of nodes

            matching_nodes.add(start)
            matching_nodes.add(end)

            # Increase the appropriate edge weight

            if start == end:
                continue

            if start not in matching_edges:
                matching_edges[start] = dict()

            if end in matching_edges[start]:
                matching_edges[start][end] += 1
            else:
                matching_edges[start][end] = 1

            if start not in matching_neighbors:
                matching_neighbors[start] = set()

            if end not in matching_neighbors:
                matching_neighbors[end] = set()

            # Remember the neighbors

            matching_neighbors[start].add(end)
            matching_neighbors[end].add(start)

    # Convert the dictionary of edge weights into a list

    matching_edge_tuples = [
        ((start, end), count)
            for start, subitems in six.iteritems(matching_edges)
                for end, count in six.iteritems(subitems)
    ]

    # Convert the set of neighbors into a list

    matching_neighbors_lists = {
        key: list(value) for key, value in matching_neighbors.iteritems()
    }

    return matching_nodes, matching_edge_tuples, matching_neighbors_lists

def normalize_query_term(query_term):
    if query_term is None:
        return None

    query_term = query_term.strip().lower()

    if len(query_term) == 0:
        return None

    return query_term

def get_codelist_matches(codelist, attributes, query_term):
    query_term = query_term.lower().strip()
    tokenized_term = set([
        item for item in re.split('[^a-z]+', query_term) if len(item) > 0
    ])

    print('Sector query terms:', tokenized_term, file=sys.stderr)

    for attribute in attributes:

        # Check if we have the attribute in the term vector

        matches = [
            key for key, value in codelist.iteritems()
                if attribute in value and len(value[attribute] & tokenized_term) > 0
        ]

        if len(matches) > 0:
            return set(matches)

        # Check if we have a string match

        raw_attribute = attribute + '_raw'

        matches = [
            key for key, value in codelist.iteritems()
                if raw_attribute in value and value[raw_attribute].find(query_term) != -1
        ]

        if len(matches) > 0:
            return set(matches)

    # We failed to get any matches, so return an empty set

    return set()

def get_search_results(query):
    query = query.lower().strip()

    # Figure out what kind of query we have

    in_query = query.split(' in ', 1)
    with_query = query.split(' with ', 1)

    sector_query = None
    location_query = None
    organization_query = None

    if len(in_query) == 2:
        sector_query, location_query = in_query
    elif len(with_query) == 2:
        sector_query, organization_query = with_query
    else:
        sector_query = query

    sector_query = normalize_query_term(sector_query)
    location_query = normalize_query_term(location_query)
    organization_query = normalize_query_term(organization_query)

    # Identify what sectors are included in the query

    filtered_sector_codes = get_codelist_matches(
        codelist_sectors,
        ['category_name', 'category_description', 'sector_name', 'sector_description'],
        sector_query
    )

    filtered_policy_marker_codes = get_codelist_matches(
        codelist_policy_markers, ['name', 'description'], sector_query)

    # Run the query

    nodes, edges, neighbors = get_organization_relationships(
        filtered_sector_codes, filtered_policy_marker_codes,
        sector_query, location_query, organization_query)

    if len(edges) == 0:
        return {
            'nodes': [],
            'edges': []
        }

    # We'll rescale the edges so that they are between 2 and 8

    edge_min = 2
    edge_max = 8
    bucket_count = edge_max - edge_min + 1

    min_count = min([edge[1] for edge in edges])
    max_count = max([edge[1] for edge in edges])

    #spaces = np.linspace(min_count, max_count, num=bucket_count)
    spaces = np.logspace(np.log2(min_count), np.log2(max_count), num=bucket_count, base=2)

    return {
        'nodes': [get_node_object(num, node) for num, node in enumerate(nodes)],
        'edges': [get_edge_object(num, edge, min_count, spaces, edge_min) for num, edge in enumerate(edges)],
        'neighbors': neighbors
    }

def get_node_object(num, node):
    return {
        'id': node,
        'label': best_label_by_ref[node],
        'type': 'publisher' if node in iati_urls_by_ref else 'participant',
        'url': list(iati_urls_by_ref[node])[0] if node in iati_urls_by_ref else '',
        'size': 9
    }

def get_edge_object(num, edge, min_count, spaces, edge_min):
    return {
        'id': str(num),
        'source': edge[0][0],
        'target': edge[0][1],
        'color': '#fff',
        'label': '%s activities' % edge[1],
        'size': np.argmax(spaces >= edge[1]) + edge_min
    }

def format_file_size(size):
    if size>1000000:
        return str(round(size/1000000,2))+' MB'
    elif size>1000:
            return str(round(size/1000,1))+' KB'
    else:
        return str(size)+' B'

def make_percent(number):
    """Given a decimal between 0-1, return a string with a 0-100
    percentage for convenient rendering"""

    if number is None:
        return str(0)

    return str(int(number*100))

def get_iati_url(organization_id):
    if organization_id in iati_urls_by_ref:
        iati_urls = list(iati_urls_by_ref[organization_id])
        return iati_urls[0]
    else:
        output='http://datastore.iatistandard.org/api/1/access/activity.xml?reporting-org=%s' % organization_id
        return output


field_lookup={'title':'Title',
                'document_link':'Documentation',
                'result':'Results',
                'budget':'Budgets',
                'description':'Description',
                'transaction':'Transactions',
                'participating_org':'Participants',
                'activity_date':'Activity Dates',
                'currency':'Currency',
                'language':'Language',}

QualColl = pymongo.MongoClient('mongodb://%s:%s' % (mongodb_host, mongodb_port)).iati.scores
def get_quality(org=False):
    if not org:
        with open('static/data/test_scores.json') as f:
            records=json.load(f)
        record=records[50] #get an arbitrary record
    else:
        try:
            record=QualColl.find_one({'organization_id': {'$eq': org}},{'_id':False})
            if not record:
                raise AidsightError("Unable to find quality data in DB", 404)
        except pymongo.errors.PyMongoError as e:
            print("pymongo error:", e)
            raise AidsightError("Error querying database", 500)

    #do some formatting
    record['percentile_rank']=make_percent(record['percentile_rank'])
    record['benford_compliance_budget']=make_percent(record['benford_compliance_budget'])
    record['benford_compliance_transaction']=make_percent(record['benford_compliance_transaction'])
    record['doc_size_avg']=format_file_size(record['doc_size_avg'])
    organization_id = record['organization_id']
    record['iati_url'] = get_iati_url(organization_id)
    for k in record:
        if not k.find('missing_data_'):
            #Convert this to percentage of data missing
            #rather than percentage of data PRESENT
            record[k]=make_percent(1-record.pop(k))


    impute_output=[]
    record['num_impute_options']=len(record['impute_options'])
    for f in record['impute_options'].iteritems():
        try:
            temp_row={'field':field_lookup[f[0]],'replacement_organization_id':f[1]['organization_id'],'url':get_iati_url(f[1]['organization_id']),'grade':f[1]['grade']}
            impute_output.append(temp_row)
        except KeyError:
            continue
    record['impute_options']=impute_output

    return pd.DataFrame([record]).T[0]
