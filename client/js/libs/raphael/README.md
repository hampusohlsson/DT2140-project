raphael-amd
===========

### About

AMD ([requirejs](http://requirejs.org/)) support for the fantastic [Raphael](https://github.com/DmitryBaranovskiy/raphael) vector graphic library

Uses `Raphael.ninja()` and `define()` wrappers to add AMD support to Raphael.

Essentially a copy of Chris Jensenuk's Raphael use in [DrawSvg](https://github.com/chrisjensenuk/DrawSvg)

This git repo is just several wrappers.

### Usage

To use, add this repo as a [git submodule](http://git-scm.com/book/en/Git-Tools-Submodules) in your project (or add the files however you want), and then include 
the path to `raphael.amd` in your `require.config()` `paths`. For example in your `main.js`

    require.config({
    // ...
    paths: {
      // ...
      'raphael': '../vendor/raphael.2.1.0.amd',
      // ...

Now you can use `raphael` as a dependency in your `define`s and `require`s:

    define(['raphael'], function(Raphael) {

or

    require(['raphael'], function(Raphael) {

    