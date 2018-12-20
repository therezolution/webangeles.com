'use strict';

var React = require('react');
var WebAngelesContactForm = require('./WebAngelesContactForm');

var openContact = function (open) {
  console.log(open);
}

React.render(<WebAngelesContactForm openContact={openContact} />,
  document.getElementById('root'));

