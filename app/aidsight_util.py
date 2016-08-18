from flask import request, Response
from StringIO import StringIO #needs older version of StringIO to work with Unicode properly
import sys

class AidsightError(Exception):
    def __init__(self, msg, status, headers=[]):
        super(AidsightError, self).__init__(self, msg)
        self.response=Response(msg, status, headers)

def format_data(data, filename):
    format=request.args.get('format', 'json')
    mimetype='text/json'
    out=StringIO()
    try:
        if format=='json':
            data.to_json(out, force_ascii=False)
            mimetype='application/json'
        elif format=='csv':
            data.to_csv(out, encoding='utf-8')
        resp=Response(out.getvalue(), status=200, mimetype=mimetype)
        resp.headers['Content-Disposition']='attachment; filename={}.{}'.format(
            filename, format)
        return resp
    except Exception as e:
        return Response("Unable to format data: "+str(e), status=500)
