import React, { Component } from 'react';
import Form from 'react-jsonschema-form';
import axios from 'axios';
import Dropdown from 'react-dropdown'

import './App.css';
import 'react-dropdown/style.css'

class App extends Component
{
  environmentSettings = {
      'Local': {
        'Klarna': {
          url: 'http://localhost:5050',
          apiKey: '084b7fa3-8d81-46e3-aba2-66efb80fb083'
        }, 
        'iDEAL': {
          url: 'http://localhost:5051',
          apiKey: 'fc06ac3a-f3b0-4656-9e05-61cb8129c621'
        }, 
        'GiroPay': {
          url: 'http://localhost:5052',
          apiKey: '084b7fa3-8d81-46e3-aba2-66efb80fb083'
        }
      },
      'QA': {
        'Klarna': {
          url: 'http://qa-gateway-internal.cko.lon/klarna-internal/',
          apiKey: '084b7fa3-8d81-46e3-aba2-66efb80fb083'
        }, 
        'iDEAL': {
          url: 'http://qa-gateway-internal.cko.lon/ideal-internal/',
          apiKey: 'fc06ac3a-f3b0-4656-9e05-61cb8129c621'
        }, 
        'GiroPay': {
          url: 'http://qa-gateway-internal.cko.lon/giropay-internal/',
          apiKey: '084b7fa3-8d81-46e3-aba2-66efb80fb083'
        }
      },
      'Production': {
        'Klarna': {
          url: 'http://localhost:5050',
          apiKey: '084b7fa3-8d81-46e3-aba2-66efb80fb083',
          defaults: {
            "klarna_merchant_id": "prod id example"
          }
        }
      }
    }

  constructor(props) {
    super(props);
    const defaultEnvironment = 'Local';
    const defaultApType = 'Klarna';
    const selectedApSettings = this.environmentSettings[defaultEnvironment][defaultApType];
    this.state = {
      environment: defaultEnvironment, 
      apType: defaultApType, 
      url: selectedApSettings.url, 
      apiKey: selectedApSettings.apiKey,
      businessId: 100001,
      onboarded: false,
      schema: {},
      data: {}
    }
    this.businessLink = '';
    this._getSchema();
  }

  environmentChanged = async (event) => {
    await this._setStateForEnvironmentAp(event.value, this.state.apType);
    this._getSchema();
  }

  apTypeChanged = async (event) => {
    await this._setStateForEnvironmentAp(this.state.environment, event.value);
    this._getSchema();
  }

  urlChanged = async (event) => {
    await this.setState({...this.state, url: event.target.value});
    this._getSchema();
  }

  apiKeyChanged = async (event) => {
    await this.setState({...this.state, apiKey: event.target.value});
    this._getSchema();
  }

  businessIdChanged = async (event) => {
    await this.setState({...this.state, businessId: event.target.value});
    this._getSchema();
  };

  dataChange = async (event) => {
    this.setState({...this.state, data: event.formData});
  }

  onboardBusiness = async (event) => {
    await axios.put(
      this.businessLink, 
      this.state.data,
      {
        headers: {
          'Authorization': this.state.apiKey
        }
      }
    );

    this.setState({...this.state, onboarded: true});
  };

  updateBusiness = async (event) => {
    await axios.put(
      this.businessLink, 
      this.state.data,
      {
        headers: {
          'Authorization': this.state.apiKey
        }
      }
    );
  };

  offboardBusiness = async (event) => {
    await axios.delete(
      this.businessLink, 
      {
        headers: {
          'Authorization': this.state.apiKey
        }
      }
    );
    
    this.setState({...this.state, onboarded: false});
  };

  log = (type) => console.log.bind(console, type);

  _setStateForEnvironmentAp = async (environment, apType) => {
    const selectedApSettings = this.environmentSettings[environment][apType];
    if (selectedApSettings) {
      await this.setState({...this.state, 
        environment: environment, 
        apType: apType, 
        url: selectedApSettings.url, 
        apiKey: selectedApSettings.apiKey
      });
    } else {
      await this.setState({...this.state, 
        environment: environment, 
        apType: ''
      });
    }
  }

  _getEnvironmentOptions() {
    return Object.keys(this.environmentSettings);
  }
  
  _getApTypeOptions() {
    return Object.keys(this.environmentSettings[this.state.environment]);
  }

  _getSchema = async () => {
    const rootResponse = await this._getRootResponse();
    const links = rootResponse.data._links;
    const onboardLinkResponse = await this._getOnboardRelationResponse(links);
    const businessResponse = await this._getBusinessResponse(links);
    const requestBodySchema = this._buildRequestParametersFromSpec(onboardLinkResponse.data);
    const onboarded = businessResponse.status === 200;
    this.setState({
      ...this.state, 
      onboarded: onboarded,
      data: onboarded ? businessResponse.data : this._getPropertyDefaults(requestBodySchema),
      schema: requestBodySchema
    });
  }

  _getRootResponse = async () => {
    return await axios.get(this.state.url, {
      headers: {
        'Authorization': this.state.apiKey
      }
    });
  }

  _getBusinessResponse = async (links) => {
    const onboardLink = links.onboard.href;
    this.businessLink = onboardLink.replace('{businessId}', this.state.businessId);
    return await axios.get(this.businessLink, {
      //we don't want axios to throw an exception on any status code... weird behaviour
      validateStatus: status => true,
      headers: {
        'Authorization': this.state.apiKey
      }
    });
  }

  _getOnboardRelationResponse = async (links) => {
    //TODO: add a root curie to api middleware:
    //const rootCurie = links.curies.find(l => l.name === '');
    //const onboardRelLink = rootCurie.href.replace('{rel}', 'onboard');
    const onboardRelLink = this.state.url + '/relations/onboard';
    return await axios.get(onboardRelLink, {
      headers: {
        'Authorization': this.state.apiKey
      }
    });
  }

  _buildRequestParametersFromSpec = (onboardSpec) => {
    const parametersSchema = onboardSpec.put.requestBody.content['application/json'].schema;
    let requestParameters;
    if (parametersSchema.allOf) {
      requestParameters = this._mergeAllOfProperties(parametersSchema);
    } else {
      requestParameters = parametersSchema;
    }
    this._setPropertyUiDefaults(requestParameters);
    return requestParameters;
  };

  _mergeAllOfProperties = (parametersSchema) => {
    if (parametersSchema.allOf.length === 0) {
      return {};
    }
    const mergedParameters = parametersSchema.allOf[0];
    parametersSchema.allOf.slice(1).forEach(parameterSet => {
      mergedParameters.required = mergedParameters.required.concat(parameterSet.required);
      mergedParameters.properties = {...mergedParameters.properties, ...parameterSet.properties};
    });
    return mergedParameters;
  }

  _setPropertyUiDefaults = (requestParameters) => {
    const apSettings = this.environmentSettings[this.state.environment][this.state.apType];
    let settingsDefaults = apSettings.defaults || {};
    for(var propertyName in requestParameters.properties) {
      const property = requestParameters.properties[propertyName];
      property.default = settingsDefaults[propertyName] || property.default || property.example;
    }
  }

  _getPropertyDefaults = (schema) => {
    const data = {}
    for(var propertyName in schema.properties) {
      const property = schema.properties[propertyName];
      data[propertyName] = property.default;
    }
    return data;
  }

  render() {
    return (
      <div>
      <div className="input-group mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text" id="basic-addon3">Environment</span>
        </div>
        <Dropdown options={this._getEnvironmentOptions()} onChange={this.environmentChanged} value={this.state.environment} className="fit-to-container form-control" placeholder="Select an option" />
      </div>
      <div className="input-group mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text" id="basic-addon3">Alternative Payment Type</span>
        </div>
        <Dropdown options={this._getApTypeOptions()} onChange={this.apTypeChanged} value={this.state.apType} className="fit-to-container form-control" placeholder="Select an option" />
      </div>
      <div className="input-group mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text" id="basic-addon3">AP Service root URL</span>
        </div>
        <input type="text" value={this.state.url} onChange={this.urlChanged} className="form-control" id="root-url" aria-describedby="basic-addon3"/>
      </div>
      <div className="input-group mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text" id="basic-addon3">API Key</span>
        </div>
        <input type="text" value={this.state.apiKey} onChange={this.apiKeyChanged} className="form-control" id="api-key" aria-describedby="basic-addon3"/>
      </div>
      <div className="input-group mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text" id="basic-addon3">Business Id</span>
        </div>
        <input type="integer" value={this.state.businessId} onChange={this.businessIdChanged} className="form-control" id="business-id" aria-describedby="basic-addon3"/>
      </div>
      <Form schema={this.state.schema}
              onChange={this.dataChange}
              onSubmit={this.log("submitted")}
              onError={this.log("errors")}
              formData={this.state.data}>
          <div>
            {this.state.onboarded ? (
              <div>
              <button onClick={this.updateBusiness} className="btn btn-primary">Update</button>
              <button onClick={this.offboardBusiness} type="submit" className="btn btn-danger">Offboard</button>
              </div>
            ): (
              <button onClick={this.onboardBusiness} className="btn btn-primary">Onboard</button>
            )}
          </div>
      </Form>
      </div>
    )
  }
}

export default App;
