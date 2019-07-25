import Vue from "vue";
import App from "./App";
import * as VueGoogleMaps from "vue2-google-maps";

Vue.use(VueGoogleMaps, {
  load: {
    key: "YOUR_GOOGLE_API_KEY",
    libraries: "places" //necessary for places input
  }
});

new Vue({
  render: h => h(App),
}).$mount('#app')
