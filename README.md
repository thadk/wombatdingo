# Open Contracting map

This repo contains the source code for the map and table widgets.

**If this is the first time you're including the widgets you have to build the `css` and `js` dependencies. Check the [Project build](#project-build) section**

## Widgets
After including the needed files the `OC_MAP` variable is exposed and with it functions to initialize both widgets.

### Map widget example
```html
<div class="oc-map--map-widget"><!-- Widget renders here --></div>
<script>
  OC_MAP.initMapWidget(document.querySelector('.oc-map--map-widget'));
</script>
```
The map widget gets initialized in the element with class `.oc-map--map-widget`

### Table widget example
```html
<div class="oc-map--table-widget"><!-- Widget renders here --></div>
<script>
  OC_MAP.initTableWidget(document.querySelector('.oc-map--table-widget'));
</script>
```
The table widget gets initialized in the element with class `.oc-map--table-widget`

## API Reference
- `OC_MAP.initMapWidget(node)`:
  Initializes the map widget injecting the code in the given node.
  - `node` - A HTML node

- `OC_MAP.initTableWidget(node)`:
  Initializes the table widget injecting the code in the given node.
  - `node` - A HTML node


## Project build
To build the project, you'll need to install the following dependencies on your system:

- Node (v4.2.x) & Npm ([nvm](https://github.com/creationix/nvm) usage is advised)

> The versions mentioned are the ones used during development. It could work with newer ones.

After these basic requirements are met, run the following commands: 
```
$ npm install
```
and to build the project:
```
$ npm run build
```

The final files are place in a directory called `dist`.  
Copy the files from the following directories to the root your website:
```
- dist/assets/scripts
- dist/assets/styles
```
and include them:
```
<link rel="stylesheet" href="main.css">
<script src="vendor.js"></script>
<script src="bundle.js"></script>
```
> Beware that the files are generated with a unique name. Double check when including them.

Now follow the steps in the [Widgets](#widgets) sections to include the widgets.

### Development commands

```
$ npm run serve
```
Compiles the sass files, javascript, and launches the server making the site available at `http://localhost:3000/`
The system will watch files and execute tasks whenever one of them changes.
The site will automatically refresh since it is bundled with livereload.
