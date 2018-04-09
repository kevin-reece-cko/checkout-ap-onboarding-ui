import React, { Component } from 'react';
import './App.css';

import Form from "react-jsonschema-form";

import axios from "axios";

class App extends Component
{
  constructor(props)
  {
    super(props);
    this.state = {
      //url: "http://dev-gateway-internal.cko.lon/giropay-internal/",
      url: "http://localhost:5000/",
      apiKey: "084b7fa3-8d81-46e3-aba2-66efb80fb083",
      businessId: 100001,
      onboarded: false,
      schema: {},
      data: {}
    }
    this.businessLink = "";
    this.getSchema();
  }

  urlChanged = (event) => {
    this.state.url = event.target.value;
    this.setState((this.state));
    this.getSchema();
  }

  apiKeyChanged = (event) => {
    this.state.apiKey = event.target.value;
    this.setState(this.state);
    this.getSchema();
  }

  businessIdChanged = (event) => {
    this.state.businessId = event.target.value;
    this.setState(this.state);
    this.getSchema();
  };

  dataChange = (event) => {
    this.state.data = event.formData;
    this.setState(this.state);
  }

  onboardBusiness = async (event) => {
    let response = await axios.put(
      this.businessLink, 
      this.state.data,
      {
        headers: {
          "Authorization": this.state.apiKey
        }
      }
    );

    this.state.onboarded = true;
    this.setState(this.state);
  };

  updateBusiness = async (event) => {
    let response = await axios.put(
      this.businessLink, 
      this.state.data,
      {
        headers: {
          "Authorization": this.state.apiKey
        }
      }
    );
  };

  offboardBusiness = async (event) => {
    let response = await axios.delete(
      this.businessLink, 
      {
        headers: {
          "Authorization": this.state.apiKey
        }
      }
    );
    this.state.onboarded = false;
    this.setState(this.state);
  };

  getSchema = async () => {
    let rootResponse = await axios.get(this.state.url, {
      headers: {
        "Authorization": this.state.apiKey
      }
    });

    let links = rootResponse.data._links;
    let gwCurie = links.curies.find(l => l.name == "gw");
    let onboardLink = links.onboard.href;
    console.log(links);
    let onboardRelLink = gwCurie.href.replace("{rel}", "onboard");

    let onboardLinkResponse = await axios.get(onboardRelLink, {
      headers: {
        "Authorization": this.state.apiKey
      }
    });

    let requestDataRef = onboardLinkResponse.data.put.parameters[0].schema["$ref"];

    let requestDataResponse = await axios.get(onboardRelLink + "/" + requestDataRef, {
      headers: {
        "Authorization": this.state.apiKey
      }
    });


    this.businessLink = onboardLink.replace("{businessId}", this.state.businessId);

    let businessResponse = await axios.get(this.businessLink, {
      //we don't want axios to throw an exception on any status code... weird behaviour
      validateStatus: status => true,
      headers: {
        "Authorization": this.state.apiKey
      }
    });
    console.log(businessResponse);
    
    this.state.onboarded = businessResponse.status == 200;
    if(this.state.onboarded)
    {
      this.state.data = businessResponse.data;
    } else
    {
      this.state.data = {};
    }

    this.state.schema = requestDataResponse.data;
    
    this.setState(this.state);
  }

  log = (type) => console.log.bind(console, type);

  render() {
    return (
      <div>
      <div class="input-group mb-3">
        <div class="input-group-prepend">
          <span class="input-group-text" id="basic-addon3">AP Service root URL</span>
        </div>
        <input type="text" value={this.state.url} onChange={this.urlChanged} class="form-control" id="root-url" aria-describedby="basic-addon3"/>
      </div>
      <div class="input-group mb-3">
        <div class="input-group-prepend">
          <span class="input-group-text" id="basic-addon3">API Key</span>
        </div>
        <input type="text" value={this.state.apiKey} onChange={this.apiKeyChanged} class="form-control" id="api-key" aria-describedby="basic-addon3"/>
      </div>
      <div class="input-group mb-3">
        <div class="input-group-prepend">
          <span class="input-group-text" id="basic-addon3">Business Id</span>
        </div>
        <input type="integer" value={this.state.businessId} onChange={this.businessIdChanged} class="form-control" id="business-id" aria-describedby="basic-addon3"/>
      </div>
      <Form schema={this.state.schema}
              onChange={this.dataChange}
              onSubmit={this.log("submitted")}
              onError={this.log("errors")}
              formData={this.state.data}>
          <div>
            {this.state.onboarded ? (
              <div>
              <button onClick={this.updateBusiness} class="btn btn-primary">Update</button>
              <button onClick={this.offboardBusiness} type="submit" class="btn btn-danger">Offboard</button>
              </div>
            ): (
              <button onClick={this.onboardBusiness} class="btn btn-primary">Onboard</button>
            )}
          </div>
      </Form>
      </div>
    )
  }
}

export default App;
