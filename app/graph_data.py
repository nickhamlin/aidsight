from __future__ import print_function
from boto.s3 import connect_to_region
from boto.s3.connection import OrdinaryCallingFormat
from config import *
import os
try:
    import cPickle as pickle
except ImportError:
    import pickle
import six
import sys
import tarfile

# Load the name and ref lookups

def download_archive(filename):
    if os.path.isfile(filename):
        return

    s3_connection = connect_to_region('us-west-2', calling_format=OrdinaryCallingFormat())
    bucket = s3_connection.get_bucket(s3_bucket, validate=False)
    key = bucket.get_key(filename)

    with open(filename, 'wb') as f:
        print('Downloading', filename, file=sys.stderr)
        key.get_file(f)

    if not os.path.isdir('data'):
        os.mkdir('data')

    with tarfile.open(filename) as f:
        print('Extracting', filename, file=sys.stderr)
        def is_within_directory(directory, target):
            
            abs_directory = os.path.abspath(directory)
            abs_target = os.path.abspath(target)
        
            prefix = os.path.commonprefix([abs_directory, abs_target])
            
            return prefix == abs_directory
        
        def safe_extract(tar, path=".", members=None, *, numeric_owner=False):
        
            for member in tar.getmembers():
                member_path = os.path.join(path, member.name)
                if not is_within_directory(path, member_path):
                    raise Exception("Attempted Path Traversal in Tar File")
        
            tar.extractall(path, members, numeric_owner=numeric_owner) 
            
        
        safe_extract(f, "data")

def load_dictionary_file(filename):
    if not prepare_search_graph or not os.path.isfile(filename):
        print('Skipping', filename, file=sys.stderr)
        return {}, {}

    print('Unpickling', filename, file=sys.stderr)
    with open(filename, 'rb') as f:
        result = pickle.load(f)

    result_lower = { key.lower(): value for key, value in six.iteritems(result) if key is not None }

    return result, result_lower

# Pickled lookup files

download_archive('lookup.tar.gz')
lookup_by_name, lookup_by_name_lower = load_dictionary_file('data/lookup_by_name.pickle')
lookup_by_ref, lookup_by_ref_lower = load_dictionary_file('data/lookup_by_ref.pickle')

download_archive('short_names.tar.gz')
short_names_by_ref, short_names_by_ref_lower = load_dictionary_file('data/short_names_by_ref.pickle')

download_archive('codelist.tar.gz')
codelist_sectors, codelist_sectors_lower = load_dictionary_file('data/codelist_sectors.pickle')
codelist_policy_markers, codelist_policy_markers_lower = load_dictionary_file('data/codelist_policy_markers.pickle')

# Pickled URL files

download_archive('iati-urls.tar.gz')
iati_urls_by_ref, iati_urls_by_ref_lower = load_dictionary_file('data/iati_urls_by_ref.pickle')

# Pickled graph files

download_archive('graph_pickle.tar.gz')
publisher_nodes, publisher_nodes_lower = load_dictionary_file('data/graph_publisher_nodes.pickle')
organization_nodes, organization_nodes_lower = load_dictionary_file('data/graph_organization_nodes.pickle')
activity_nodes, activity_nodes_lower = load_dictionary_file('data/graph_activity_nodes.pickle')
activity_relationships, activity_relationships_lower = load_dictionary_file('data/graph_activity_relationships.pickle')

# Derive the optimal names

def resembles_label(label):
    for i, ch in enumerate(label):
        if ch.isdigit():
            return False

    return True

def get_best_label(labels):
    best_label = None

    for label in labels:
        if not resembles_label(label):
            continue

        if label.find('(') != -1:
            if best_label is None or best_label.find('(') == -1 or len(label) > len(best_label):
                best_label = label

        elif best_label is None or best_label.find('(') == -1:
            best_label = label

    return best_label

best_label_by_ref = {}

for node in organization_nodes.iterkeys():
    if node in short_names_by_ref:
        labels = short_names_by_ref[node]
    elif node in lookup_by_ref:
        labels = list(lookup_by_ref[node])
    else:
        labels = []

    label = get_best_label(labels)

    if label is None:
        label = node

    best_label_by_ref[node] = label
