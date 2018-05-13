import axios from 'axios'
import https from 'https'


const HTTP = axios.create({
  // baseURL: 'https://localhost',
  // baseURL: 'http://10.0.2.2:8000',
  baseURL: process.env.SERVER_URL,
  withCredentials: true,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

HTTP.absUrl = function (url) {
  return HTTP.defaults.baseURL + url
}

HTTP.appendParams = function (url, params) {
  const u = new URL(url)
  for (let key in params) {
    if (params[key] !== undefined) {
      u.searchParams.append(key, params[key])
    }
  }
  return u.href
}

HTTP.login = function (username, password) {
  const params = new FormData()
  params.append('username', username)
  params.append('password', password)

  return HTTP.post('/login/', params)
}

HTTP.logout = function () {
  return HTTP.get('/logout/')
}

HTTP.project = function (project) {
  const opts = {
    transformResponse (text) {
      // console.log('META', JSON.parse(text))
      const urlFields = ['mapcache_url', 'legend_url', 'ows_url']
      const data = JSON.parse(text)
      urlFields.forEach(param => {
        if (data[param]) {
          data[param] = HTTP.defaults.baseURL + data[param]
        }
      })
      return data
    }
  }
  return HTTP.get(`/project.json?PROJECT=${project}`, opts)
}

export default HTTP
