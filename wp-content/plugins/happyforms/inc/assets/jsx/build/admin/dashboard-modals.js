/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./build/inc/assets/jsx/src/admin/dashboard-modals.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./build/core/assets/jsx/src/admin/dashboard-modals.js":
/*!*************************************************************!*\
  !*** ./build/core/assets/jsx/src/admin/dashboard-modals.js ***!
  \*************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/defineProperty */ "./node_modules/@babel/runtime/helpers/defineProperty.js");
/* harmony import */ var _babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__);





/**
 *
 * Modal handler class
 *
 */

/* harmony default export */ __webpack_exports__["default"] = (function ($, settings) {
  const {
    render
  } = wp.element;
  /**
   *
   * Deactivation modal
   *
   */

  const DeactivateModal = props => {
    const [option, setOption] = Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["useState"])('yes');

    const onChange = e => {
      setOption(e.target.value);
    };

    const onSubmit = () => {
      $.post(ajaxurl, {
        action: settings.deactivateModalAction,
        _wpnonce: settings.deactivateModalNonce,
        keep_data: option
      }, function () {
        window.location.href = props.redirectURL;
      });
      return props.onRequestClose();
    };

    return Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__["Modal"], {
      className: "happyforms-modal happyforms-modal--deactivate",
      title: "What about your data?",
      onRequestClose: props.onRequestClose
    }, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])("div", {
      className: "happyforms-modal__body",
      onChange: onChange
    }, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])("label", {
      htmlFor: "happyforms-keep-data-yes"
    }, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])("input", {
      type: "radio",
      id: "happyforms-keep-data-yes",
      name: "happyforms-keep-data",
      value: "yes",
      defaultChecked: true
    }), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])("span", null, Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__["__"])('Keep plugin data (recommended)', 'happyforms'))), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])("label", {
      htmlFor: "happyforms-keep-data-no"
    }, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])("input", {
      type: "radio",
      id: "happyforms-keep-data-no",
      name: "happyforms-keep-data",
      value: "no"
    }), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])("span", null, Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__["__"])('Permanently delete plugin data', 'happyforms')))), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])("div", {
      className: "happyforms-modal__footer"
    }, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])("div", {
      className: "happyforms-modal__footer-button-group"
    }, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__["Button"], {
      isPrimary: true,
      onClick: onSubmit,
      text: option == 'yes' ? Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__["__"])('Deactivate Plugin', 'happyforms') : Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__["__"])('Delete Data and Deactivate Plugin', 'happyforms')
    }))));
  };
  /**
   *
   * Modal wrapper
   *
   */


  const ModalProvider = props => {
    return Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__["SlotFillProvider"], null, props.modal, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__["Popover"].Slot, null));
  };

  return class DashboardModals {
    constructor() {
      _babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_0___default()(this, "area", null);

      this.area = document.getElementById('happyforms-modals-area');
    }

    openDeactivateModal(redirectURL) {
      var modal = Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])(DeactivateModal, {
        onRequestClose: this.closeModal.bind(this, 'deactivate'),
        redirectURL: redirectURL
      });
      this.openModal(modal);
    }

    openModal(modal) {
      render(Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])(ModalProvider, {
        modal: modal
      }), this.area);
    }

    closeModal(modal) {
      render(Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["Fragment"], null), this.area);
      $.post(ajaxurl, {
        action: settings.actionModalDismiss,
        id: modal
      });
    }

  };
});

/***/ }),

/***/ "./build/inc/assets/jsx/src/admin/dashboard-modals.js":
/*!************************************************************!*\
  !*** ./build/inc/assets/jsx/src/admin/dashboard-modals.js ***!
  \************************************************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _happyforms_core_jsx_src_admin_dashboard_modals__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @happyforms/core/jsx/src/admin/dashboard-modals */ "./build/core/assets/jsx/src/admin/dashboard-modals.js");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__);






(function ($, settings) {
  /**
   *
   * Onboarding modal
   *
   */
  const OnboardingModal = props => {
    const imageURL = `${settings.pluginURL}/inc/assets/img/welcome.gif`;
    const [email, setEmail] = Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["useState"])('');
    const [poweredBy, setPoweredBy] = Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["useState"])(false);

    const onEmailChange = e => {
      setEmail(e.target.value);
    };

    const onRequestClose = () => {
      $.post(ajaxurl, {
        action: settings.onboardingModalAction,
        _wpnonce: settings.onboardingModalNonce,
        email: email,
        powered_by: poweredBy ? 1 : 0
      });
      return props.onRequestClose();
    };

    return Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__["Guide"], {
      onFinish: onRequestClose,
      className: "happyforms-modal happyforms-modal--onboarding",
      pages: [{
        image: Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("picture", null, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("img", {
          src: imageURL,
          width: "450",
          height: "276"
        })),
        content: Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["Fragment"], null, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("div", {
          className: "happyforms-modal__header"
        }, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("h1", null, Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__["__"])('Welcome to Happyforms', 'happyforms')), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("p", null, Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__["__"])('We\'ll send you a few emails each month about plugin updates. And don\'t sweat it, you can unsubscribe anytime.', 'happyforms'))), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("div", {
          className: "happyforms-modal__body"
        }, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("label", null, Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__["__"])('Email address', 'happyforms')), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("input", {
          type: "email",
          value: email,
          onChange: onEmailChange,
          autoFocus: true
        }), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("label", {
          className: "happyforms-radio-label"
        }, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__["CheckboxControl"], {
          checked: poweredBy,
          onChange: setPoweredBy
        }), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("span", null, Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__["__"])('Yes, I want to help support the free plugin by adding a powered by link in the footer of my forms and emails.', 'happyforms')))), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("div", {
          className: "happyforms-modal__footer"
        }, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__["BaseControl"], null, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__["Button"], {
          isPrimary: true,
          onClick: onRequestClose,
          text: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__["__"])('Continue', 'happyforms')
        }))))
      }]
    });
  };
  /**
   *
   * Upgrade modal
   *
   */


  const UpgradeModal = props => {
    const imageURL = `${settings.pluginURL}/inc/assets/img/alrighty.gif`;
    return Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__["Guide"], {
      onFinish: props.onRequestClose,
      className: "happyforms-modal happyforms-modal--upgrade",
      pages: [{
        image: Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("picture", null, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("img", {
          src: imageURL,
          width: "450",
          height: "276"
        })),
        content: Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["Fragment"], null, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("div", {
          className: "happyforms-modal__header"
        }, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("h1", null, Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__["__"])('Start with a free 7-day trial', 'happyforms'))), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("div", {
          className: "happyforms-modal__body"
        }, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("p", null, Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__["__"])('You\'re just a mouse click and a few key taps away from building better forms for your site. And don\'t sweat it, you can upgrade, downgrade or cancel your trial anytime.', 'happyforms')), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("ul", null, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("li", null, Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__["__"])('Advanced features and integrations', 'happyforms')), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("li", null, Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__["__"])('Help from the friendliest support team around', 'happyforms')), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("li", null, Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__["__"])('Automatically transfer over your free forms', 'happyforms')), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("li", null, Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__["__"])('New goodies released every second week', 'happyforms'))), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("p", null, Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__["__"])('So whattaya say? Ready to build better forms today?', 'happyforms'))), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])("div", {
          className: "happyforms-modal__footer"
        }, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__["BaseControl"], null, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__["Button"], {
          isPrimary: true,
          href: "https://happyforms.io/upgrade",
          target: "_blank",
          text: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__["__"])('Start a Free 7-day Trial', 'happyforms')
        }), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__["Button"], {
          isSecondary: true,
          onClick: props.onRequestClose,
          text: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__["__"])('Nope, Maybe Later', 'happyforms')
        }))))
      }]
    });
  };

  const DashboardModalsBaseClass = Object(_happyforms_core_jsx_src_admin_dashboard_modals__WEBPACK_IMPORTED_MODULE_1__["default"])($, settings);

  class DashboardModalsClass extends DashboardModalsBaseClass {
    openOnboardingModal() {
      var modal = Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])(OnboardingModal, {
        onRequestClose: this.closeModal.bind(this, 'onboarding'),
        status: settings.trackingStatus
      });
      this.openModal(modal);
    }

    openUpgradeModal() {
      var modal = Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__["createElement"])(UpgradeModal, {
        onRequestClose: this.closeModal.bind(this, 'upgrade')
      });
      this.openModal(modal);
    }

  }

  ;
  var happyForms = window.happyForms || {};
  window.happyForms = happyForms;
  happyForms.modals = new DashboardModalsClass();
})(jQuery, _happyFormsDashboardModalsSettings);

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/defineProperty.js":
/*!***************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/defineProperty.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

module.exports = _defineProperty;
module.exports["default"] = module.exports, module.exports.__esModule = true;

/***/ }),

/***/ "@wordpress/components":
/*!************************************!*\
  !*** external ["wp","components"] ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports) {

(function() { module.exports = window["wp"]["components"]; }());

/***/ }),

/***/ "@wordpress/element":
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports) {

(function() { module.exports = window["wp"]["element"]; }());

/***/ }),

/***/ "@wordpress/i18n":
/*!******************************!*\
  !*** external ["wp","i18n"] ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

(function() { module.exports = window["wp"]["i18n"]; }());

/***/ })

/******/ });
//# sourceMappingURL=dashboard-modals.js.map