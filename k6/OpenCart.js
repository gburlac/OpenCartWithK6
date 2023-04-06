import { sleep, check, group } from 'k6';
import http from 'k6/http';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { SharedArray } from "k6/data";
import { randomIntBetween, 
  randomString,
  randomItem,
  uuidv4,
  findBetween } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

const csvData = new SharedArray("another data name", function() {  return papaparse.parse(open('./users.csv'), { header: true }).data;});

export const options = {
   thresholds: {
   http_req_duration: ['p(99)>=1'],
   //load_generator_memory_used_percent: ["value>1"],
   //load_generator_cpu_percent: ["value>1"],
	},
     
   stages: [
        { target: 5, duration: '10s'},
        {target: 10, duration: '15s'},
      ],
}

export function handleSummary(data) {
  return {
    "summary.html": htmlReport(data),
  };
}

export default function() {
  var url = 'http://172.23.176.132';
  console.log ('Url===: ' + url);
  let formData, response;
  let newUser = csvData[__VU - 1];
  console.log('User===: ', JSON.stringify(newUser));
  const params = {
    email: newUser.email,
    password: newUser.password,
  };
//Home
  group('home', function () {
    response = http.get(url + '/opencart/upload/index.php?route=common/home', {
      headers: {
        'upgrade-insecure-requests': '1',
      },
    })
	check(response, { 'body contains Featured': response => response.body.includes('Featured') })
    sleep(3.9)
  })
//Login
  group(
    'account/login',
    function () {
      response = http.get(url + '/opencart/upload/index.php?route=account/login', {
        headers: {
          'upgrade-insecure-requests': '1',
        },
      })
        check(response, {
          'body contains Returning Customer': response =>
            response.body.includes('Returning Customer'),
      })
      sleep(4.1)

      formData = new FormData()
      formData.boundary = '----WebKitFormBoundaryCxEn3Utde0fgXECN'
      formData.append("email", {
        data: newUser.email,
        content_type: "text/plain",
      });
      formData.append("password", {
        data: newUser.password,
        content_type: "text/plain",
      });

      response = http.post(
        url + '/opencart/upload/index.php?route=account/login', formData.body(),
        {
          headers: {
            'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryCxEn3Utde0fgXECN',
            origin: "'"+ url +"'",
            'upgrade-insecure-requests': '1',
          },
        }
      );
      check(response, {
        "body contains Your Store": response =>
          response.body.includes("Your Store"),
      });
      sleep(3.2)
    }
  )
//Category 
  group(
    'category',
    function () {
      response = http.get(
        url + '/opencart/upload/index.php?route=product/category&path=24',
        {
          headers: {
            'upgrade-insecure-requests': '1',
          },
        }
      );
      check(response, {
        "body contains wishlist.add": responsels =>
          response.body.includes("wishlist.add"),
      });
      sleep(2.8)
    }
  )
  
      var product_id_list = findBetween(response.body, '<a href="'+ url + '/opencart/upload/index.php?route=product/product&amp;path=24&amp;product_id=','">',true);
      console.log('Product_id_list===: ' + product_id_list);
      let random_product_id = randomItem(product_id_list);
      console.log('Product_id_selected===: ' + random_product_id);
      sleep(2.8);
      
      // Add product
      response = http.post(
        url + '/opencart/upload/index.php?route=checkout/cart/add',
        {
          quantity: '1',
          product_id: random_product_id,
        },
        {
          headers: {
            accept: 'application/json, text/javascript, */*; q=0.01',
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'x-requested-with': 'XMLHttpRequest',
          },
        }
      );
      check(response, {
        "body contains success": response => response.body.includes("success"),
      });
       // Cart Info
      response = http.get(
        url + '/opencart/upload/index.php?route=common/cart/info',
        {
          headers: {
            accept: 'text/html, */*; q=0.01',
            'x-requested-with': 'XMLHttpRequest',
          },
        }
      );
      check(response, {
        "body contains Total": response => response.body.includes("Total"),
      });
     sleep(1.8);
  
    //Log out
     group(
    'logout',
    function () {
      response = http.get(url + '/opencart/upload/index.php?route=account/logout', {
        headers: {
          'upgrade-insecure-requests': '1',
        },
      })
      check(response, {
        "body contains Account Logout": response =>
          response.body.includes("Account Logout"),
      });
    }
  )
}
