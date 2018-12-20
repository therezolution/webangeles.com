/* global window, escape, alert */
'use strict';
var _ = require('lodash');
var $ = require('jquery');
var React = require('react/addons');

var autosize;

try {
  autosize = require('autosize');
} catch (e) {
  if (!e instanceof ReferenceError) {
    throw e;
  }
}

var ContactOverlay = React.createClass({
  propTypes: {
    openContact: React.PropTypes.func.isRequired
  },

  handleClose: function (event) {
    event.preventDefault();
    this.props.openContact(false);
  },

  render: function () {
    return (
      <div className='overlay-screen-contact'>
        <a className="overlay-close" onClick={this.handleClose}>
          <span className="icon-cross"></span>
        </a>
        <Form setOverlayOpen={this.props.openContact} />
      </div>
    );
  }
});

var Footer = React.createClass({
  render: function () {
    return (
      <div className="ancillary-contact vcard">
        <div className="wrapper-connect">
          <div className="title-ancillary">Connect</div>
          <div className="list">
            <a className="url monochrome" href="https://www.facebook.com/WebAngelesLLC/" target="_blank">Facebook</a>
            <a className="url monochrome" href="http://twitter.com/webangeles" target="_blank">Twitter</a>
            <a className="url monochrome" href="http://github.com/webangeles" target="_blank">Github</a>
          </div>
        </div>
        <div className="wrapper-visit">
          <div className="title-ancillary">Office</div>
          <a className="location-wrapper organization-unit adr"
            href="#" >
            <span className="fn organization-name" style={{ display: 'none' }}>WebAngeles</span>
            <span>WebAngeles</span><br />
            <span className="locality">Los Angeles</span>, <span className="region">CA</span>

          </a>

        </div>
      </div>
    );
  }
});

// Gathers all truthy values in obj referenced by keys and returns matching
// keys in an array
var gatherTruthy = function (/* obj, ...keys */) {
  var keys = Array.prototype.slice.call(arguments);
  var result = [];

  var obj = keys.shift();

  _.each(keys, function (key) {
    if (obj[key] && result.indexOf(key) === -1) {
      result.push(key);
    }
  });

  return result;
};

var Form = React.createClass({
  mixins: [React.addons.LinkedStateMixin],

  getInitialState: function () {
    return {
      name: '',
      email: '',
      about: '',
      development: false,
      engineering: false,
      consulting: false,
      onetime: false,
      recurring: false,
      year: false,
      '2-5k': false,
      '5-25k': false,
      '+25k': false,
      notsure: false,
      website: false,
      crm: false,
      eCommerce: false,
      database: false,
      other: false,
      errors: {},
      submitting: false
    };
  },

  getModel: function () {
    var model = _.pick(this.state, 'name', 'email', 'about');
    model.services = gatherTruthy(this.state, 'development', 'engineering', 'consulting');
    model.product = gatherTruthy(this.state, 'website', 'crm', 'eCommerce', 'database', 'other');
    model.timing = gatherTruthy(this.state, 'onetime', 'recurring');
    model.budget = gatherTruthy(this.state, '2-5k', '5-25k', '+25k', 'notsure');

    return model;
  },

  handleSubmit: function (event) {
    event.preventDefault();

    if (this.validate()) {
      this.send();
    }
  },

  componentDidMount: function () {
    autosize($(this.refs.about.getDOMNode()));
  },

  alertClass: function (name) {
    return this.state.errors[name] ? 'alert' : '';
  },

  // urgh, wish we had a schema library
  validate: function () {
    var errors = this.state.errors = {},
      valid = true,
      model = this.getModel();

    _.each(['name', 'email', 'about'], function (field) {
      if (!model[field]) {
        errors[field] = 'is required';
        valid = false;
      } else if (model[field].length > 10000) {
        errors[field] = 'is too long';
        valid = false;
      }
    });

    _.each(['services', 'timing'], function (field) {
      if (!model[field].length) {
        errors[field] = 'is required';
        valid = false;
      }
    });

    if (this.shouldHaveBudget() && !model.budget.length) {
      errors.budget = 'is required';
      valid = false;
    }

    if (this.shouldHaveProduct() && !model.product.length) {
      errors.product = 'is required';
      valid = false;
    }

    this.setState({ errors: errors });

    return valid;
  },

  send: function () {
    var model = this.getModel();
    // var body = React.renderToStaticMarkup(<FormEmail model={model} />);

    var data = _.extend({
      subject: "Website Referral Form:" + model.name
    }, model);

    this.setState({ submitting: true });

    $.ajax({
      type: "POST",
      url: "https://jf7i62a039.execute-api.us-west-2.amazonaws.com/WebAngelesLive/contact-us",
      dataType: "json",
      crossDomain: "true",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function () {
        alert("Thank you. We will contact you shortly");
        document.getElementById("contact-form").reset();
        location.reload();
      },
      error: function () {
        alert("UnSuccessfull");
      },
      complete: function () {
        this.setState({ submitting: false });
        this.props.setOverlayOpen(false);
      }.bind(this)
    });

    /*
        $.post(url, data, null, 'json')
          .done(function () {
            alert('Thank you. We will contact you shortly'); // eslint-disable-line no-alert
          })
          .fail(function () {
            console.log('Falling back to mailto');
            console.log('url:' + url);
            console.log(data);
            console.log(arguments);
          })
          .always(function () {
            this.setState({ submitting: false });
            this.props.setOverlayOpen(false);
          }.bind(this));
    */

  },

  error: function (name) {
    if (this.state.errors[name]) {
      return (<span className="error">{this.state.errors[name]}</span>);
    }
  },

  shouldHaveBudget: function () {
    return this.state.development || this.state.engineering;
  },

  shouldHaveProduct: function () {
    return this.state.development || this.state.engineering;
  },

  render: function () {

    var budgetFieldsetClasses = "fieldset-group " + (this.shouldHaveBudget() ? 'visible' : 'hidden');
    var productFieldsetClasses = "fieldset-group product " + (this.shouldHaveProduct() ? 'visible' : 'hidden');

    var servicesError = this.error('services');

    var servicesLabel = servicesError ? servicesError :
      (<span className="subtext">Select all that apply</span>);

    return (
      <form id="contact-form" className="contact-form-wrapper" onSubmit={this.handleSubmit}>
        <div className="title-overlay">Work with us</div>
        <fieldset>
          <div className="input-symbol left">
            <input type="text" name="name" className={this.alertClass('name')} placeholder="Name" valueLink={this.linkState('name')} />
            <span className="icon-user"></span>
          </div>
          <div className="input-symbol left">
            <input type="email" name="email" className={this.alertClass('email')} placeholder="Email Address" valueLink={this.linkState('email')} />
            <span className="icon-email"></span>
          </div>
          <textarea className={'about ' + this.alertClass('about')} name="about" placeholder="About your company and project" valueLink={this.linkState('about')} ref="about" />

          <div className="fieldset-group services">
            <div className="fieldset-group-title">Services {servicesLabel}</div>

            <div className="btns-group">

              <input type="checkbox" name="services" value="development" id="development" checkedLink={this.linkState('development')} />
              <label htmlFor="development" className="btn-toggle">Development</label>

              <input type="checkbox" name="services" value="engineering" id="engineering" checkedLink={this.linkState('engineering')} />
              <label htmlFor="engineering" className="btn-toggle">Could Engineering</label>

              <input type="checkbox" name="services" value="consulting" id="consulting" checkedLink={this.linkState('consulting')} />
              <label htmlFor="consulting" className="btn-toggle">Consulting</label>
            </div>
          </div>

          <div className={productFieldsetClasses}>
            <div className="fieldset-group-title">Product {this.error('product')}</div>
            <div className="btns-group">
              <input type="radio" name="product" value="website" id="website" checkedLink={this.linkState('website')} />
              <label htmlFor="website" className="btn-toggle">Website</label>

              <input type="radio" name="product" value="crm" id="crm" checkedLink={this.linkState('crm')} />
              <label htmlFor="crm" className="btn-toggle">CRM</label>

              <input type="radio" name="product" value="eCommerce" id="eCommerce" checkedLink={this.linkState('eCommerce')} />
              <label htmlFor="eCommerce" className="btn-toggle">E-Commerce</label>

              <input type="radio" name="product" value="database" id="database" checkedLink={this.linkState('database')} />
              <label htmlFor="database" className="btn-toggle" >Database</label>

              <input type="radio" name="product" value="other" id="other" checkedLink={this.linkState('other')} />
              <label htmlFor="other" className="btn-toggle">Other</label>
            </div>
          </div>

          <div className="fieldset-group">
            <div className="fieldset-group-title">Project Type {this.error('timing')}</div>

            <div className="btns-group">
              <input type="radio" name="timing" value="onetime" id="onetime" checkedLink={this.linkState('onetime')} />
              <label htmlFor="onetime" className="btn-toggle">One-Time</label>

              <input type="radio" name="timing" value="recurring" id="recurring" checkedLink={this.linkState('recurring')} />
              <label htmlFor="recurring" className="btn-toggle">Recurring</label>
            </div>
          </div>

          <div className={budgetFieldsetClasses}>
            <div className="fieldset-group-title">Budget {this.error('budget')}</div>

            <div className="btns-group">
              <input type="radio" name="budget" value="2-5k" id="2-5k" checkedLink={this.linkState('2-5k')} />
              <label htmlFor="2-5k" className="btn-toggle">2k–5k</label>

              <input type="radio" name="budget" value="5-25k" id="5-25k" checkedLink={this.linkState('5-25k')} />
              <label htmlFor="5-25k" className="btn-toggle">5k–25k</label>

              <input type="radio" name="budget" value="+25k" id="+25k" checkedLink={this.linkState('+25k')} />
              <label htmlFor="+25k" className="btn-toggle" >+25k</label>

              <input type="radio" name="budget" value="notsure" id="notsure" checkedLink={this.linkState('notsure')} />
              <label htmlFor="notsure" className="btn-toggle">Not sure</label>
            </div>

          </div>
          <button className="btn-primary caps" disabled={this.state.submitting} type="submit">Send Message</button>
        </fieldset>
        <Footer />
      </form>
    );
  }
});

var FormEmail = React.createClass({
  render: function () {
    var model = this.props.model;

    var servicesNodes = model.services.map(function (service, index) {
      return (<li key={index}>{service}</li>);
    });

    var timing = model.timing.join();
    var budget = model.budget.join();

    var budgetNodes = budget ? [<dt key='0'>Budget</dt>, <dd key='1'>{budget}</dd>] : null;

    return (
      <dl>
        <dt>Name</dt><dd>{model.name}</dd>
        <dt>Email</dt><dd>{model.email}</dd>
        <dt>About</dt><dd>{model.about}</dd>
        <dt>Services</dt><dd><ul>{servicesNodes}</ul></dd>
        <dt>Timing</dt><dd>{timing}</dd>
        {budgetNodes}
        <dt>Referer</dt><dd>Site</dd>
      </dl>
    );
  }
});

module.exports = ContactOverlay;
