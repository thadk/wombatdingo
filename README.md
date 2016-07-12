# GGwash map 1

Copy the files from the following directories to the root of your website or to link them on my domain:
```
- assets/scripts
- assets/styles
```
and include them like:
```
<link rel="stylesheet" href="main.css">
<script src="vendor.js"></script>
<script src="bundle.js"></script>
```
> Beware that the files are generated with a unique name. Double check when including them.

## Widgets
After including the assets, the `OC_MAP` variable is exposed and with it functions to initialize both widgets.

### Map widget example
```html
<div class="oc-map--map-widget"><!-- Widget renders here --></div>
<script>
  OC_MAP.initMapWidget(document.querySelector('.oc-map--map-widget'));
</script>
```
The map widget gets initialized in the element with class `.oc-map--map-widget`

## API Reference
- `OC_MAP.initMapWidget(node)`:
  Initializes the map widget injecting the code in the given node.
  - `node` - A HTML node

## Development commands

```
$ npm run serve
```
Compiles the sass files, javascript, and launches the server making the site available at `http://localhost:3000/`
The system will watch files and execute tasks whenever one of them changes.
The site will automatically refresh since it is bundled with livereload.

(based on OC Map - https://github.com/open-contracting-partnership/oc-map)
