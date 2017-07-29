#!/usr/bin/env python

# Usage:
# python update_nav.py

# white list files you want to update in list_of_files below
# write your new nav bar inside the write_new_nav function

import os
import sys


list_of_files = [
"index.html",
"middle-body.html",
"middle-body2.html",
"middle-body3.html",
"nosecone.html",
"nosecone2.html",
"nosecone3.html",  
"lower-body.html",  
"lower-body2.html",
"assembly.html"  
]

def write_new_nav(target):
    target.write(
    """
    <nav id="mainNav" class="navbar navbar-default navbar-fixed-top">
        <div class="container-fluid">
            <!-- Brand and toggle get grouped for better mobile display -->
            <div class="navbar-header">
                <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
                    <span class="sr-only">Toggle navigation</span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                </button>
                <a class="navbar-brand page-scroll" href="http://stageoneeducation.com">Stage One Education</a>
            </div>

            <!-- Collect the nav links, forms, and other content for toggling -->
            <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                <ul class="nav navbar-nav navbar-right">
                    <li>
                        <a class="page-scroll" href="index.html">Getting Started</a>
                    </li>
                    <li>
                        <a class="page-scroll" href="middle-body.html">1. Fuselage</a>
                    </li>
                    <li>
                        <a class="page-scroll" href="lower-body.html">2. Fins+Booster</a>
                    </li>
                    <li>
                        <a class="page-scroll" href="nosecone.html">3. Nosecone</a>
                    </li>
                    <li>
                        <a class="page-scroll" href="assembly.html">Assembly</a>
                    </li>
                </ul>
            </div>
            <!-- /.navbar-collapse -->
        </div>
        <!-- /.container-fluid -->
    </nav>
    """)


def replace_nav(html_file):
    target = open("replacing.html", 'w')

    found_nav = False

    print "opening ...", html_file
    with open(html_file) as f:
        content = f.readlines()
        content = [x.strip('\n') for x in content] 
        for index, val in enumerate(content):

            if '<nav id="mainNav" class="navbar navbar-default navbar-fixed-top">' in val:
                found_nav = True
                write_new_nav(target)

            if '</nav>' in val:
                found_nav = False

            #if found_nav:
                # do nothing

            if not found_nav:
                target.write(val)
                target.write('\n')

    target.close()
    print("mv replacing.html " + html_file)
    os.system("mv replacing.html " + html_file)


def crawl_dir(dir_full_path):
    for root, dirs, files in os.walk(dir_full_path):
        for filename in sorted(files):
            filename_full_path = os.path.join(root, filename)
            rel_path = os.path.relpath(filename_full_path, dir_full_path)
            if filename in list_of_files:
                print "found an html file in list", filename
                replace_nav(filename)

crawl_dir(os.getcwd())



