#!/bin/bash
for filename in js/core/*.js; do
    lebab $filename -o $filename --enable class,template,arrow,let,default-param,obj-method,obj-shorthand,no-strict
done