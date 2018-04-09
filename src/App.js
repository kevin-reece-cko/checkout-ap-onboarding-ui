import React, { Component } from 'react';
import Form from "react-jsonschema-form";
import axios from "axios";

import './App.css';

class App extends Component
{
  constructor(props)
  {
    super(props);
    this.state = {
      url: "http://dev-gateway-internal.cko.lon/giropay-internal/",
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
    this.setState({...this.state, 'url': event.target.value});
    this.getSchema();
  }

  apiKeyChanged = (event) => {
    this.setState({...this.state, 'apiKey': event.target.value});
    this.getSchema();
  }

  businessIdChanged = (event) => {
    this.setState({...this.state, 'businessId': event.target.value});
    this.getSchema();
  };

  dataChange = (event) => {
    this.setState({...this.state, 'data': event.formData});
  }

  onboardBusiness = async (event) => {
    await axios.put(
      this.businessLink, 
      this.state.data,
      {
        headers: {
          "Authorization": this.state.apiKey
        }
      }
    );

    this.setState({...this.state, 'onboarded': true});
  };

  updateBusiness = async (event) => {
    await axios.put(
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
    await axios.delete(
      this.businessLink, 
      {
        headers: {
          "Authorization": this.state.apiKey
        }
      }
    );
    
    this.setState({...this.state, 'onboarded': false});
  };

  getSchema = async () => {
    let rootResponse = await axios.get(this.state.url, {
      headers: {
        "Authorization": this.state.apiKey
      }
    });

    let links = rootResponse.data._links;
    let gwCurie = links.curies.find(l => l.name === "gw");
    let onboardLink = links.onboard.href;
    
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
    
    
    let onboarded = businessResponse.status === 200;
    this.setState({
      ...this.state, 
      'onboarded': onboarded,
      'data': onboarded ? businessResponse.data : {},
      'schema': requestDataResponse.data
    });
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
