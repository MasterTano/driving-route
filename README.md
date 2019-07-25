## About Driving Route
Driving Route is a simple application that shows the route for the place you want to go to.
You'll just set your starting point and drop off point. It uses Google's Maps API, Directions API and Places API made with Vue.js.
This is one of the challenge given to me by a company I applied in.

![Driving Route Screenshot](https://raw.githubusercontent.com/username/projectname/branch/path/to/img.png)

## Project setup
```
yarn install
```

### Google Map API key
1) Generate google api key and enable the following API
- Directions API
- Maps Javascript API
- Places API
2) Go to /src/main.js file and put the api key on line 7

### Compiles and hot-reloads for development
```
yarn run serve
```

### Use Mocked API checkbox
I added a functionality that will allow us to use mocked api or the real google maps api. Selecting starting point and Drop off point will automatically generate the route direction.

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
