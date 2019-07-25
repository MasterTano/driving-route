import Axios from 'axios'

export let axios = Axios.create({
  baseURL: 'https://mock-api.dev.lalamove.com',
})

// before a request is made start the nprogress
axios.interceptors.request.use(config => {
  NProgress.start()
  return config
}, function (error) {
  NProgress.done()
  return Promise.reject(error);
})

// before a response is returned stop nprogress
axios.interceptors.response.use(response => {
  NProgress.done()
  return response
}, function (error) {
  NProgress.done()
  return Promise.reject(error);
})