( function( $, _, Backbone, api, settings ) {

	var happyForms;
	var classes = {};
	classes.models = {};
	classes.models.parts = {};
	classes.collections = {};
	classes.views = {};
	classes.views.parts = {};
	classes.routers = {};

	classes.models.Form = Backbone.Model.extend( {
		idAttribute: 'ID',
		defaults: settings.form,

		getPreviewUrl: function() {
			var previewUrl =
				settings.baseUrl +
				'?post_type=' + this.get( 'post_type' ) +
				'&p=' + this.id +
				'&preview=true';

			return previewUrl;
		},

		isNew: function() {
			return ( 0 == this.id );
		},

		initialize: function( attrs, options ) {
			Backbone.Model.prototype.initialize.apply( this, arguments );

			this.attributes.parts = new classes.collections.Parts( this.get( 'parts' ), options );

			this.changeDocumentTitle();
		},

		toJSON: function() {
			var json = Backbone.Model.prototype.toJSON.apply( this, arguments );
			json.parts = json.parts.toJSON();

			return json;
		},

		save: function( options ) {
			var self = this;
			options = options || {};

			var request = wp.ajax.post( 'happyforms-update-form', _.extend( {
				'happyforms-nonce': api.settings.nonce.happyforms,
				happyforms: 1,
				form_id: this.id,
				wp_customize: 'on',
			}, {
				form: JSON.stringify( this.toJSON() )
			} ) );

			request.done( function( response ) {
				if ( self.isNew() ) {
					happyForms.updateFormID( response.ID );
				}

				if ( happyForms.previewLoaded ) {
					api.previewer.refresh();
				}

				self.trigger( 'save', response );

				if ( options.success ) {
					options.success( response );
				}
			} );

			request.fail( function( response ) {
				// noop
			} );
		},

		changeDocumentTitle: function() {
			var title = $( 'title' ).text();
			var newTitle = '';

			newTitle = title.replace( title.substring( 0, title.indexOf( ':' ) ), 'Form' );
			$( 'title' ).text( newTitle );

			var formTitle = this.get( 'post_title' );
			var titleTemplate = 'Form';

			if ( formTitle ) {
				titleTemplate = titleTemplate + ': ' + formTitle;
			}

			_wpCustomizeSettings.documentTitleTmpl = titleTemplate;
		},

		fetchCustomCSS: function( success ) {
			var data = {
				action: 'happyforms-get-custom-css',
				'happyforms-nonce': api.settings.nonce.happyforms,
				happyforms: 1,
				wp_customize: 'on',
				form_id: happyForms.form.id,
				form: JSON.stringify( this.toJSON() ),
			};

			var request = $.ajax( ajaxurl, {
				type: 'post',
				dataType: 'text',
				data: data,
			} );

			request.done( success );
		},
	} );

	classes.models.Part = Backbone.Model.extend( {
		initialize: function( attributes ) {
			Backbone.Model.prototype.initialize.apply( this, arguments );

			if ( ! this.id ) {
				var id = happyForms.utils.uniqueId( this.get( 'type' ) + '_', this.collection );
				this.set( 'id', id );
			}
		},

		fetchHtml: function( success ) {
			var data = {
				action: 'happyforms-form-part-add',
				'happyforms-nonce': api.settings.nonce.happyforms,
				happyforms: 1,
				wp_customize: 'on',
				form_id: happyForms.form.id,
				form: JSON.stringify( happyForms.form.toJSON() ),
				part: this.toJSON(),
			};

			var request = $.ajax( ajaxurl, {
				type: 'post',
				dataType: 'html',
				data: data
			} );

			happyForms.previewSend( 'happyforms-form-part-disable', {
				id: this.get( 'id' ),
			} );

			request.done( success );
		}
	} );

	classes.collections.Parts = Backbone.Collection.extend( {
		model: function( attrs, options ) {
			var model = PartFactory.model( attrs, options );
			return model;
		},

		fetchHtml: function( success ) {
			var data = {
				action: 'happyforms-form-parts-add',
				'happyforms-nonce': api.settings.nonce.happyforms,
				happyforms: 1,
				wp_customize: 'on',
				form_id: happyForms.form.id,
				form: JSON.stringify( happyForms.form.toJSON() ),
				parts: this.toJSON(),
			};

			var request = $.ajax( ajaxurl, {
				type: 'post',
				dataType: 'json',
				data: data
			} );

			happyForms.previewSend( 'happyforms-form-parts-disable', {
				ids: this.pluck( 'id' ),
			} );

			request.done( success );
		},
	} );

	var PartFactory = {
		model: function( attrs, options, BaseClass ) {
			BaseClass = BaseClass || classes.models.Part;
			return new BaseClass( attrs, options );
		},

		view: function( attrs, BaseClass ) {
			BaseClass = BaseClass || classes.views.Part;
			return new BaseClass( attrs );
		},
	};

	HappyForms = Backbone.Router.extend( {
		routes: {
			'build': 'build',
			'setup': 'setup',
			'email': 'email',
			'style': 'style',
			'messages': 'messages',
		},

		steps: [ 'build', 'setup', 'email', 'style', 'messages' ],
		previousRoute: '',
		currentRoute: 'build',
		savedStates: {
			'build': {
				'scrollTop': 0,
				'activePartIndex': -1
			},
			'setup': {
				'scrollTop': 0,
			},
			'email': {
				'scrollTop': 0,
			},
			'messages': {
				'scrollTop': 0,
			},
			'style': {
				'scrollTop': 0,
				'activeSection': ''
			}
		},
		form: false,
		previewLoaded: false,
		buffer: [],

		initialize: function( options ) {
			Backbone.Router.prototype.initialize( this, arguments );

			this.listenTo( this, 'route', this.onRoute );
		},

		start: function( options ) {
			this.parts = new Backbone.Collection();
			this.parts.reset( _( settings.formParts ).values() );
			this.form = new classes.models.Form( settings.form, { silent: true } );
			this.actions = new classes.views.Actions( { model: this.form } ).render();
			this.sidebar = new classes.views.Sidebar( { model: this.form } ).render();

			Backbone.history.start();
			api.previewer.previewUrl( this.form.getPreviewUrl() );

			this.initilizeGlobalControls();
		},

		initilizeGlobalControls: function() {
			if ( this.form.attributes.ID  == 0 ) {
				this.form.attributes.part_title_label_placement = 'above';
			}
		},

		flushBuffer: function() {
			if ( this.buffer.length > 0 ) {
				_.each( this.buffer, function( entry ) {
					api.previewer.send( entry.event, entry.data );
				} );

				this.buffer = [];
			}
		},

		previewSend: function( event, data, options ) {
			if ( happyForms.previewer.ready ) {
				api.previewer.send( event, data );
			} else {
				happyForms.buffer.push( {
					event: event,
					data: data,
				} );
			}
		},

		onRoute: function( segment ) {
			this.sidebar.steps.disable();

			var previousStepIndex = this.steps.indexOf( this.currentRoute ) + 1;
			var stepIndex = this.steps.indexOf( segment ) + 1;
			var direction = previousStepIndex < stepIndex ? 1: -1;
			var stepProgress = Math.round( stepIndex / ( this.steps.length ) * 100 );
			var childView;

			switch( segment ) {
				case 'setup':
					childView = new classes.views.FormSetup( { model: this.form } );
					break;
				case 'build':
					childView = new classes.views.FormBuild( { model: this.form } );
					break;
				case 'email':
					childView = new classes.views.FormEmail( { model: this.form } );
					break;
				case 'style':
					childView = new classes.views.FormStyle( { model: this.form } );
					break;
				case 'messages':
					childView = new classes.views.FormMessages( { model: this.form } );
					break;
			}

			this.previousRoute = this.currentRoute;
			this.currentRoute = segment;

			if ( 'style' !== this.previousRoute ) {
				this.savedStates[this.previousRoute]['scrollTop'] = this.sidebar.$el.scrollTop();
			}

			this.sidebar.doStep( {
				step: {
					slug: segment,
					index: stepIndex,
					progress: stepProgress,
					count: this.steps.length,
				},
				direction: direction,
				child: childView,
			} );

			this.sidebar.steps.enable();
		},

		forward: function() {
			var nextStepIndex = this.steps.indexOf( this.currentRoute ) + 1;
			nextStepIndex = Math.min( nextStepIndex, this.steps.length - 1 );
			var nextStep = this.steps[nextStepIndex];

			this.navigate( nextStep, { trigger: true } );
		},

		back: function() {
			var previousStepIndex = this.steps.indexOf( this.currentRoute ) - 1;
			previousStepIndex = Math.max( previousStepIndex, 0 );

			var previousStep = this.steps[previousStepIndex];
			this.navigate( previousStep, { trigger: true } );
		},

		updateFormID: function( id ) {
			var url = window.location.href.replace( /form_id=[\d+]/, 'form_id=' + id );
			window.location.href = url;
		},

		setup: function() {
			// noop
		},

		build: function() {
			// noop
		},

		style: function() {
			// noop
		},

	} );

	classes.views.Base = Backbone.View.extend( {
		events: {
			'mouseover [data-pointer]': 'onHelpMouseOver',
			'mouseout [data-pointer]': 'onHelpMouseOut',
		},

		pointers: {},

		initialize: function() {
			if ( this.template ) {
				this.template = _.template( $( this.template ).text() );
			}

			this.listenTo( this, 'ready', this.ready );

			// Capture and mute link clicks to avoid
			// hijacking Backbone router and breaking
			// Customizer navigation.
			this.delegate( 'click', '.happyforms-stack-view a:not(.external)', this.muteLink );
		},

		ready: function() {
			// Noop
		},

		muteLink: function( e ) {
			e.preventDefault();
		},

		setupHelpPointers: function() {
			var $helpTriggers = $( '[data-pointer]', this.$el );
			var self = this;

			$helpTriggers.each( function() {
				var $trigger = $( this );
				var $control = $trigger.parents( '.customize-control' );
				var pointerId = $control.attr( 'id' );
				var $target = $control.find( '[data-pointer-target]' );

				var $pointer = $target.pointer( {
					pointerClass: 'wp-pointer happyforms-help-pointer',
					content: $( 'span', $trigger ).html(),
					position: {
						edge: 'left',
						align: 'center',
					},
					open: function( e, ui ) {
						ui.pointer.css( 'margin-left', '-1px' );
					},
					close: function( e, ui ) {
						ui.pointer.css( 'margin-left', '0' );
					},
					buttons: function() {},
				} );

				self.pointers[pointerId] = $pointer;
			} );
		},

		onHelpMouseOver: function( e ) {
			var $target = $( e.target );
			var $control = $target.parents( '.customize-control' );
			var pointerId = $control.attr( 'id' );
			var $pointer = this.pointers[pointerId];

			if ( $pointer ) {
				$pointer.pointer( 'open' );
			}
		},

		onHelpMouseOut: function( e ) {
			var $target = $( e.target );
			var $control = $target.parents( '.customize-control' );
			var pointerId = $control.attr( 'id' );
			var $pointer = this.pointers[pointerId];

			if ( $pointer ) {
				$pointer.pointer( 'close' );
			}
		},

		unbindEvents: function() {
			// Unbind any listenTo handlers
			this.stopListening();
			// Unbind any delegated DOM handlers
			this.undelegateEvents()
			// Unbind any direct view handlers
			this.off();
		},

		remove: function() {
			this.unbindEvents();
			Backbone.View.prototype.remove.apply( this, arguments );
		},
	} );

	classes.views.Actions = classes.views.Base.extend( {
		el: '#customize-header-actions',
		template: '#happyforms-customize-header-actions',

		events: {
			'click #happyforms-save-button': 'onSaveClick',
			'click #happyforms-close-link': 'onCloseClick',
			'onbeforeunload': 'onWindowClose',
		},

		initialize: function() {
			classes.views.Base.prototype.initialize.apply( this, arguments );

			this.listenTo( this.model, 'change', this.onFormChange );
			$( window ).bind( 'beforeunload', this.onWindowClose.bind( this ) );
		},

		render: function() {
			this.$el.html( this.template( {
				isNewForm: this.model.isNew()
			} ) );

			return this;
		},

		enableSave: function() {
			var $saveButton = $( '#happyforms-save-button', this.$el );

			$saveButton.prop( 'disabled', false ).text( $saveButton.data( 'text-default' ) );
		},

		disableSave: function() {
			$( '#happyforms-save-button', this.$el ).attr( 'disabled', 'disabled' );
		},

		isDirty: function() {
			return $( '#happyforms-save-button', this.$el ).is( ':enabled' );
		},

		onFormChange: function() {
			this.enableSave();
		},

		onCloseClick: function( e ) {
			if ( this.isDirty() ) {
				var message = $( e.currentTarget ).data( 'message' );

				if ( ! confirm( message ) ) {
					e.preventDefault();
					e.stopPropagation();

					return false;
				} else {
					$( window ).unbind( 'beforeunload' );
				}
			}
		},

		onWindowClose: function() {
			if ( this.isDirty() ) {
				return '';
			}
		},

		onSaveClick: function( e ) {
			e.preventDefault();

			var self = this;

			this.disableSave();

			this.model.save({
				success: function() {
					var $saveButton = $( '#happyforms-save-button', this.$el );

					$saveButton.text( $saveButton.data('text-saved') );
				}
			});
		},
	} );

	classes.views.Sidebar = classes.views.Base.extend( {
		el: '.wp-full-overlay-sidebar-content',

		steps: null,
		current: null,
		previous: null,

		render: function( options ) {
			this.$el.empty();
			this.steps = new classes.views.Steps( { model: this.model } );

			return this;
		},

		doStep: function( options ) {
			var child = options.child.render();
			this.$el.append( child.$el );
			child.trigger( 'ready' );

			if ( this.current ) {
				this.previous = this.current;
				this.current = child;

				this.current.$el.show();
				this.previous.$el.hide();
				this.onStepComplete();
			} else {
				this.current = child;
				this.current.$el.show();
				this.steps.render( options );
			}
		},

		onStepComplete: function( options ) {
			this.previous.remove();
			this.steps.render( options );
			this.$el.scrollTop( happyForms.savedStates[happyForms.currentRoute]['scrollTop'] );
		}
	} );

	classes.views.Steps = classes.views.Base.extend( {
		el: '#happyforms-steps-nav',
		template: '#happyforms-form-steps-template',

		events: {
			'click .nav-tab': 'onStepClick'
		},

		initialize: function() {
			classes.views.Base.prototype.initialize.apply( this, arguments );

			this.disabled = false;
		},

		render: function( options ) {
			var data = _.extend( {}, options, { form: this.model.toJSON() } );
			this.$el.html( this.template( data ) );
			this.$el.show();
		},

		onStepClick: function( e ) {
			e.preventDefault();

			if ( this.disabled ) {
				return;
			}

			var $link = $( e.target );
			var stepID = $link.attr( 'data-step' );

			$( '.nav-tab', this.$el ).removeClass( 'nav-tab-active' );
			$link.addClass( 'nav-tab-active' );

			happyForms.navigate( stepID, { trigger: true } );
		},

		disable: function() {
			this.disabled = true;
		},

		enable: function() {
			this.disabled = false;
		}

	} );

	classes.views.FormBuild = classes.views.Base.extend( {
		template: '#happyforms-form-build-template',

		events: {
			'keyup #happyforms-form-name': 'onNameChange',
			'click #happyforms-form-name': 'onNameInputClick',
			'click .happyforms-add-new-part': 'onPartAddButtonClick',
			'change #happyforms-form-name': 'onNameChange',
			'click .expand-collapse-all': 'onExpandCollapseAllClick',
			'global-attribute-set': 'onSetGlobalAttribute',
			'global-attribute-unset': 'onUnsetGlobalAttribute',
		},

		drawer: null,

		globalAttributes: {},

		initialize: function() {
			classes.views.Base.prototype.initialize.apply( this, arguments );

			this.partViews = new Backbone.Collection();

			this.listenTo( happyForms, 'part-add', this.onPartAdd );
			this.listenTo( happyForms, 'part-duplicate', this.onPartDuplicate );
			this.listenTo( this.model.get( 'parts' ), 'add', this.onPartModelAdd );
			this.listenTo( this.model.get( 'parts' ), 'remove', this.onPartModelRemove );
			this.listenTo( this.model.get( 'parts' ), 'change', this.onPartModelChange );
			this.listenTo( this.model.get( 'parts' ), 'reset', this.onPartModelsSorted );
			this.listenTo( this.partViews, 'add', this.onPartViewAdd );
			this.listenTo( this.partViews, 'remove', this.onPartViewRemove );
			this.listenTo( this.partViews, 'reset', this.onPartViewsSorted );
			this.listenTo( this.partViews, 'add remove reset', this.onPartViewsChanged );
			this.listenTo( this, 'sort-stop', this.onPartSortStop );
		},

		render: function() {
			this.setElement( this.template( this.model.toJSON() ) );
			return this;
		},

		ready: function() {
			this.model.get( 'parts' ).each( function( partModel ) {
				this.addViewPart( partModel );
			}, this );

			$( '.happyforms-form-widgets', this.$el ).sortable( {
				items: '> .happyforms-widget:not(.no-sortable)',
				handle: '.happyforms-part-widget-top',
				axis: 'y',
				tolerance: 'pointer',
				scroll: true,
				scrollSpeed: 5,

				stop: function ( e, ui ) {
					this.trigger( 'sort-stop', e, ui );
				}.bind( this ),
			} );

			this.drawer = new classes.views.PartsDrawer();
			$( '.wp-full-overlay' ).append( this.drawer.render().$el );

			if ( -1 === happyForms.savedStates.build.activePartIndex ) {
				$( '#happyforms-form-name', this.$el ).trigger( 'focus' ).trigger( 'select' );
			}
		},

		onNameInputClick: function( e ) {
			var $input = $(e.target);

			$input.trigger( 'select' );
		},

		onNameChange: function( e ) {
			e.preventDefault();

			var value = $( e.target ).val();
			this.model.set( 'post_title', value );
			happyForms.previewSend( 'happyforms-form-title-update', value );
		},

		onPartAddButtonClick: function( e ) {
			e.preventDefault();
			e.stopPropagation();

			this.drawer.toggle();
		},

		onPartAdd: function( type, options ) {
			var partModel = PartFactory.model(
				{ type: type },
				{ collection: this.model.get( 'parts' ) },
			);

			this.drawer.close();

			partModel.set( 'description_mode', happyForms.form.get( 'part_description_mode' ) );

			this.model.get( 'parts' ).add( partModel, options );
			this.model.trigger( 'change', this.model );

			partModel.fetchHtml( function( response ) {
				var data = {
					html: response,
				};

				happyForms.previewSend( 'happyforms-form-part-add', data );
			} );
		},

		onPartDuplicate: function( part, options ) {
			var attrs = part.toJSON();
			delete attrs.id;

			var duplicate = PartFactory.model(
				attrs,
				{ collection: this.model.get( 'parts' ) },
			);

			happyForms.trigger( 'part-duplicate-complete', part, duplicate );

			var index = this.model.get( 'parts' ).indexOf( part );
			var after = part.get( 'id' );
			options = options || {};
			options.at = index + 1;

			this.model.get( 'parts' ).add( duplicate, options );
			this.model.trigger( 'change', this.model );

			duplicate.fetchHtml( function( response ) {
				var data = {
					html: response,
					after: after,
				};

				happyForms.previewSend( 'happyforms-form-part-add', data );
			} );
		},

		onPartModelAdd: function( partModel, partsCollection, options ) {
			this.addViewPart( partModel, options );

			for ( var attribute in this.globalAttributes ) {
				if ( partModel.has( attribute ) ) {
					partModel.set( attribute, this.globalAttributes[attribute] );
				}
			}
		},

		onPartModelRemove: function( partModel ) {
			this.model.trigger( 'change', this.model );

			var partViewModel = this.partViews.find( function( viewModel ) {
				return viewModel.get( 'view' ).model.id === partModel.id;
			}, this );

			this.partViews.remove( partViewModel );

			happyForms.previewSend( 'happyforms-form-part-remove', partModel.id );
		},

		onPartModelChange: function( partModel ) {
			this.model.trigger( 'change' );
		},

		onPartModelsSorted: function() {
			this.partViews.reset( _.map( this.model.get( 'parts' ).pluck( 'id' ), function( id ) {
				return this.partViews.get( id );
			}, this ) );
			this.model.trigger( 'change' );

			var ids = this.model.get( 'parts' ).pluck( 'id' );
			happyForms.previewSend( 'happyforms-form-parts-sort', ids );
		},

		addViewPart: function( partModel, options ) {
			var settings = happyForms.parts.findWhere( { type: partModel.get( 'type' ) } );

			if ( settings ) {
				var partView = PartFactory.view( _.extend( {
					type: settings.get( 'type' ),
					model: partModel,
					settings: settings,
				}, options ) );

				var partViewModel = new Backbone.Model( {
					id: partModel.id,
					view: partView,
				} );

				this.partViews.add( partViewModel, options );
			}
		},

		onPartViewAdd: function( viewModel, collection, options ) {
			var partView = viewModel.get( 'view' );

			if ( 'undefined' === typeof( options.index ) ) {
				$( '.happyforms-form-widgets', this.$el ).append( partView.render().$el );
			} else if ( 0 === options.index ) {
				$( '.happyforms-form-widgets', this.$el ).prepend( partView.render().$el );
			} else {
				$( '.happyforms-widget:nth-child(' + options.index + ')', this.$el ).after( partView.render().$el );
			}

			partView.trigger( 'ready' );

			if ( options.scrollto ) {
				this.$el.parent().animate( {
					scrollTop: partView.$el.position().top
				}, 400 );
			}
		},

		onPartViewRemove: function( viewModel ) {
			var partView = viewModel.get( 'view' );
			partView.remove();
		},

		onPartSortStop: function( e, ui ) {
			var $sortable = $( '.happyforms-form-widgets', this.$el );
			var ids = [];

			$( '.happyforms-widget', $sortable ).each( function() {
				ids.push( $(this).attr( 'data-part-id' ) );
			} );

			this.model.get( 'parts' ).reset( _.map( ids, function( id ) {
				return this.model.get( 'parts' ).get( id );
			}, this ) );
		},

		onPartViewsSorted: function( partViews ) {
			var $stage = $( '.happyforms-form-widgets', this.$el );

			partViews.forEach( function( partViewModel ) {
				var partView = partViewModel.get( 'view' );
				var $partViewEl = partView.$el;
				$partViewEl.detach();
				$stage.append( $partViewEl );
				partView.trigger( 'refresh' );
			}, this );
		},

		onPartViewsChanged: function( partViews ) {
			if ( this.partViews.length > 0 ) {
				this.$el.addClass( 'has-parts' );
			} else {
				this.$el.removeClass( 'has-parts' );
			}
		},

		onSetGlobalAttribute: function( e, data ) {
			this.partViews
				.filter( function( viewModel ) {
					return viewModel.id !== data.id
				} )
				.forEach( function( viewModel ) {
					var view = viewModel.get( 'view' );
					$( '[data-apply-to="' + data.attribute + '"]', view.$el ).prop( 'checked', false );
					$( '[data-bind="' + data.attribute + '"]', view.$el ).val( data.value );
					view.model.set( data.attribute, data.value );
				} );

			this.globalAttributes[data.attribute] = data.value;
		},

		onUnsetGlobalAttribute: function( e, data ) {
			this.partViews
				.filter( function( viewModel ) {
					return viewModel.id !== data.id
				} )
				.forEach( function( viewModel ) {
					var view = viewModel.get( 'view' );
					var previous = view.model.previous( data.attribute );
					$( '[data-bind="' + data.attribute + '"]', view.$el ).val( previous );
					view.model.set( data.attribute, previous );
				} );

			delete this.globalAttributes[data.attribute];
		},

		remove: function() {
			while ( partView = this.partViews.first() ) {
				this.partViews.remove( partView );
			};

			this.drawer.close();
			this.drawer.remove();

			classes.views.Base.prototype.remove.apply( this, arguments );
		},
	} );

	classes.views.PartsDrawer = classes.views.Base.extend( {
		template: '#happyforms-form-parts-drawer-template',

		events: {
			'click .happyforms-parts-list-item': 'onListItemClick',
			'keyup #part-search': 'onPartSearch',
			'change #part-search': 'onPartSearch',
			'click .happyforms-clear-search': 'onClearSearchClick'
		},

		initialize: function() {
			classes.views.Base.prototype.initialize.apply( this, arguments );

			$( '.wp-full-overlay-sidebar' ).on( 'click', this.close.bind( this ) );
		},

		render: function() {
			this.setElement( this.template( { parts: happyForms.parts.toJSON() } ) );
			this.applyConditionClasses();
			return this;
		},

		applyConditionClasses: function() {
			var partTypes = happyForms.form.get( 'parts' ).map( function( model ) {
				return model.get( 'type' );
			} );

			partTypes = _.union( partTypes );

			for ( var i = 0; i < partTypes.length; i++ ) {
				this.$el.addClass( 'has-' + partTypes[i] );
			}
		},

		onListItemClick: function( e ) {
			e.stopPropagation();

			var $li = $( e.currentTarget );

			if ( $li.hasClass( 'happyforms-parts-list-item--dummy' ) || $li.hasClass( 'happyforms-parts-list-item--group' ) ) {
				return;
			}

			var type = $li.data( 'part-type' );
			happyForms.trigger( 'part-add', type, { expand: true } );
		},

		onPartSearch: function( e ) {
			var search = $( e.target ).val().toLowerCase();
			var $clearButton = $( e.target ).nextAll( 'button' );
			var $partEls = $( '.happyforms-parts-list-item', this.$el );

			if ( '' === search ) {
				$partEls.removeClass( 'hidden' );
				$clearButton.removeClass( 'active' );
			} else {
				$clearButton.addClass( 'active' );
			}

			var results = happyForms.parts.filter( function( part ) {
				var label = part.get( 'label' ).toLowerCase();
				var description = part.get( 'description' ).toLowerCase();

				return label.indexOf( search ) >= 0 || description.indexOf( search ) >= 0;
			} );

			$partEls.addClass( 'hidden' );

			results.forEach( function( part ) {
				$( '.happyforms-parts-list-item[data-part-type="' + part.get( 'type' ) + '"]', this.$el ).removeClass( 'hidden' );
			} );
		},

		onClearSearchClick: function( e ) {
			$( '#part-search', this.$el ).val( '' ).trigger( 'change' );
		},

		toggle: function() {
			this.$el.toggleClass( 'expanded' );
			$( 'body' ).toggleClass( 'adding-happyforms-parts' );

			if ( this.$el.hasClass( 'expanded') ) {
				$( '#part-search' ).trigger( 'focus' );
			}
		},

		close: function() {
			this.$el.removeClass( 'expanded' );
			$( 'body' ).removeClass( 'adding-happyforms-parts' );
		}
	} );

	classes.views.Part = classes.views.Base.extend( {
		$: $,

		events: {
			'click .happyforms-widget-action': 'onWidgetToggle',
			'click .happyforms-form-part-close': 'onWidgetToggle',
			'click .happyforms-form-part-remove': 'onPartRemoveClick',
			'click .happyforms-form-part-duplicate': 'onPartDuplicateClick',
			'keyup [data-bind]': 'onInputChange',
			'change [data-bind]': 'onInputChange',
			'change input[type=number]': 'onNumberChange',
			'mouseover': 'onMouseOver',
			'mouseout': 'onMouseOut',
			'click .apply-all-check': 'applyOptionGlobally',
			'click .happyforms-form-part-advanced-settings': 'onAdvancedSettingsClick',
			'click .happyforms-form-part-logic': 'onLogicButtonClick',
		},

		initialize: function( options ) {
			classes.views.Base.prototype.initialize.apply( this, arguments );
			this.settings = options.settings;

			// listen to changes in common settings
			this.listenTo( this.model, 'change:label', this.onPartLabelChange );
			this.listenTo( this.model, 'change:width', this.onPartWidthChange );
			this.listenTo( this.model, 'change:required', this.onRequiredCheckboxChange );
			this.listenTo( this.model, 'change:placeholder', this.onPlaceholderChange );
			this.listenTo( this.model, 'change:description', this.onDescriptionChange );
			this.listenTo( this.model, 'change:default_value', this.onDefaultValueChange );
			//this.listenTo( this.model, 'change:description_mode', this.onDescriptionModeChange );
			this.listenTo( this.model, 'change:label_placement', this.onLabelPlacementChange );
			this.listenTo( this.model, 'change:css_class', this.onCSSClassChange );
			this.listenTo( this.model, 'change:focus_reveal_description', this.onFocusRevealDescriptionChange );
			this.listenTo( this.model, 'change:prefix', this.onPartPrefixChange );
			this.listenTo( this.model, 'change:suffix', this.onPartSuffixChange );

			if ( options.expand ) {
				this.listenTo( this, 'ready', this.expandToggle );
			}
		},

		render: function() {
			this.setElement( this.template( {
				settings: this.settings.toJSON(),
				instance: this.model.toJSON(),
			} ) );

			return this;
		},

		/**
		 * Trigger a previewer event on mouse over.
		 *
		 * @since 1.0.0.
		 *
		 * @return void
		 */
		onMouseOver: function() {
			var data = {
				id: this.model.id,
				callback: 'onPartMouseOverCallback',
			};

			happyForms.previewSend( 'happyforms-part-dom-update', data );
		},

		/**
		 * Trigger a previewer event on mouse out.
		 *
		 * @since 1.0.0.
		 *
		 * @return void
		 */
		onMouseOut: function() {
			var data = {
				id: this.model.id,
				callback: 'onPartMouseOutCallback',
			};

			happyForms.previewSend( 'happyforms-part-dom-update', data );
		},

		/**
		 * Send changed label value to previewer.
		 *
		 * @since 1.0.0.
		 *
		 * @return void
		 */
		onPartLabelChange: function() {
			var data = {
				id: this.model.id,
				callback: 'onPartLabelChangeCallback',
			};

			happyForms.previewSend( 'happyforms-part-dom-update', data );
		},

		/**
		 * Send data about changed part width to previewer.
		 *
		 * @since 1.0.0.
		 *
		 * @return void
		 */
		onPartWidthChange: function( model, value, options ) {
			var data = {
				id: this.model.id,
				callback: 'onPartWidthChangeCallback',
			};

			happyForms.previewSend( 'happyforms-part-dom-update', data );
		},

		/**
		 * Trigger a previewer event on change of the "This is a required field" checkbox.
		 *
		 * @since 1.0.0.
		 *
		 * @return void
		 */
		onRequiredCheckboxChange: function() {
			var model = this.model;

			var data = {
				id: this.model.id,
				callback: 'onRequiredCheckboxChangeCallback',
			};

			happyForms.previewSend( 'happyforms-part-dom-update', data );
		},

		/**
		 * Slide toggle part view in the customize pane.
		 *
		 * @since 1.0.0.
		 *
		 * @return void
		 */
		expandToggle: function() {
			var $el = this.$el;

			this.closeOpenWidgets( $el );

			$( '.happyforms-widget-content', this.$el ).slideToggle( 200, function() {
				$el.toggleClass( 'happyforms-widget-expanded' );

				if ( $el.hasClass( 'happyforms-widget-expanded' ) ) {
					$( 'input[data-bind=label]', $el ).trigger( 'focus' );
				}

			} );

			happyForms.savedStates.build.activePartIndex = $el.index();
		},

		closeOpenWidgets: function( $currentElement ) {
			var $openWidgets = $( '.happyforms-widget-expanded' ).not( $currentElement );

			$( '.happyforms-widget-content', $openWidgets ).slideUp( 200, function() {
				$openWidgets.removeClass( 'happyforms-widget-expanded' );
			} );
		},

		/**
		 * Call expandToggle method on toggle indicator click or 'Close' button click of the part view in Customize pane.
		 *
		 * @since 1.0.0.
		 *
		 * @return void
		 */
		onWidgetToggle: function( e ) {
			e.preventDefault();
			this.expandToggle();
		},

		/**
		 * Remove part model from collection on "Delete" button click.
		 *
		 * @since 1.0.0.
		 *
		 * @return void
		 */
		onPartRemoveClick: function( e ) {
			e.preventDefault();

			var self = this;

			$( '.happyforms-widget-content', this.$el ).slideUp( 'fast', function() {
				$( this ).removeClass( 'happyforms-widget-expanded' );

				self.model.collection.remove( self.model );
			} );
		},

		onPartDuplicateClick: function( e ) {
			e.preventDefault();

			happyForms.trigger( 'part-duplicate', this.model, {
				expand: true,
				scrollto: true,
			} );
		},

		/**
		 * Update model with the changed data. Triggered on change event of inputs in the part view.
		 *
		 * @since 1.0.0.
		 *
		 * @return void
		 */
		onInputChange: function( e ) {
			var $el = $( e.target );
			var value = $el.val();
			var attribute = $el.data( 'bind' );

			if ( 'label' === attribute ) {
				var $inWidgetTitle = this.$el.find('.in-widget-title');
				$inWidgetTitle.find('span').text(value);

				if ( value ) {
					$inWidgetTitle.show();
				} else {
					$inWidgetTitle.hide();
				}
			}

			if ( $el.is(':checkbox') ) {
				if ( $el.is(':checked') ) {
					value = 1;
				} else {
					value = 0;
				}
			}

			this.model.set( attribute, value );
		},

		/**
		 * Send changed placeholder value to previewer.
		 *
		 * @since 1.0.0.
		 *
		 * @return void
		 */
		onPlaceholderChange: function() {
			var data = {
				id: this.model.id,
				callback: 'onPlaceholderChangeCallback',
			};

			happyForms.previewSend( 'happyforms-part-dom-update', data );
		},

		/**
		 * Send changed default value to previewer.
		 *
		 * @since 1.0.0.
		 *
		 * @return void
		 */
		onDefaultValueChange: function() {
			var data = {
				id: this.model.id,
				callback: 'onDefaultValueChangeCallback',
			};

			happyForms.previewSend( 'happyforms-part-dom-update', data );
		},

		/**
		 * Send changed description value to previewer.
		 *
		 * @since 1.0.0.
		 *
		 * @return void
		 */
		onDescriptionChange: function( model, value ) {
			var data = {
				id: this.model.id,
				// callback: 'onDescriptionChangeCallback',
			};

			if ( value ) {
				this.showDescriptionOptions();
			} else {
				model.set('tooltip_description', 0);
				this.hideDescriptionOptions();
			}

			model.set( 'description_mode', happyForms.form.get( 'part_description_mode' ) );
			model.fetchHtml( function( response ) {
				var data = {
					id: model.get( 'id' ),
					html: response,
				};

				happyForms.previewSend( 'happyforms-form-part-refresh', data );
			} );
		},

		/**
		 * Trigger a previewer event on tooltip description checkbox change.
		 *
		 * @since 1.1.0.
		 *
		 * @return void
		 */
		onDescriptionModeChange: function( model, value ) {
			if ( 'tooltip' === model.get( 'description_mode' ) || 'tooltip' === model.previous( 'description_mode' ) ) {
				// reset mode to 'Standard' if label display is set to 'Hidden'
				if ( 'hidden' === model.get( 'label_placement' ) ) {
					this.resetDescriptionMode();

					return;
				}

				model.fetchHtml( function( response ) {
					var data = {
						id: model.get( 'id' ),
						html: response,
					};

					happyForms.previewSend( 'happyforms-form-part-refresh', data );
				} );
			} else {
				var data = {
					id: model.id,
					callback: 'onDescriptionModeChangeCallback',
				};

				happyForms.previewSend( 'happyforms-part-dom-update', data );
			}
		},

		/**
		 * Send data about changed label placement value to previewer.
		 *
		 * @since 1.0.0.
		 *
		 * @return void
		 */
		onLabelPlacementChange: function( model, value, options ) {
			var $select = $( '[data-bind=label_placement]', this.$el );

			if ( 'hidden' === value ) {
				$( '[data-bind=description_mode] option[value=tooltip]', this.$el ).hide();

				this.resetDescriptionMode();
			} else {
				$( '[data-bind=description_mode] option[value=tooltip]', this.$el ).show();
			}

			if ( $('option[value='+value+']', $select).length > 0 ) {
				$select.val( value );

				if ( 'as_placeholder' === value ) {
					$( '.happyforms-placeholder-option', this.$el ).hide();
				} else {
					$( '.happyforms-placeholder-option', this.$el ).show();
				}

				model.fetchHtml( function( response ) {
					var data = {
						id: model.get( 'id' ),
						html: response,
					};

					happyForms.previewSend( 'happyforms-form-part-refresh', data );
				} );
			} else {
				model.set('label_placement', model.previous('label_placement'), { silent: true });
			}
		},

		resetDescriptionMode: function() {
			var $descriptionModeDropdown = $( '[data-bind=description_mode]', this.$el );

			if ( $descriptionModeDropdown.length ) {
				this.model.set( 'description_mode', '' );
				$descriptionModeDropdown.val( '' );
			}
		},

		applyOptionGlobally: function( e ) {
			var $input = $( e.target );
			var attribute = $input.attr( 'data-apply-to' );

			if ( $input.is( ':checked' ) ) {
				this.$el.trigger( 'global-attribute-set', {
					id: this.model.id,
					attribute: attribute,
					value: this.model.get( attribute ),
				} );
			} else {
				this.$el.trigger( 'global-attribute-unset', {
					id: this.model.id,
					attribute: attribute,
				} );
			}
		},

		onCSSClassChange: function( model, value, options ) {
			var data = {
				id: this.model.id,
				callback: 'onCSSClassChangeCallback',
				options: options,
			};

			happyForms.previewSend( 'happyforms-part-dom-update', data );
		},

		showDescriptionOptions: function() {
			this.$el.find('.happyforms-description-options').fadeIn();
		},

		hideDescriptionOptions: function() {
			var $descriptionOptionsWrap = this.$el.find('.happyforms-description-options');

			$descriptionOptionsWrap.fadeOut(200, function() {
				$descriptionOptionsWrap.find('input').prop('checked', false);
			});
		},

		onFocusRevealDescriptionChange: function( model, value ) {
			if ( 1 == value && 1 == model.get( 'tooltip_description' ) ) {
				$( '[data-bind=tooltip_description]', this.$el ).prop('checked', false ).trigger('change');
			}

			var data = {
				id: this.model.id,
				callback: 'onFocusRevealDescriptionCallback',
			};

			happyForms.previewSend('happyforms-part-dom-update', data);
		},

		onAdvancedSettingsClick: function( e ) {
			$( '.happyforms-part-advanced-settings-wrap', this.$el ).slideToggle( 300, function() {
				$( e.target ).toggleClass( 'opened' );
			} );
		},

		onLogicButtonClick: function( e ) {
			e.preventDefault();
			e.stopPropagation();

			$( '.happyforms-part-logic-wrap', this.$el ).slideToggle( 300, function() {
				$( e.target ).toggleClass( 'opened' );
			} );
		},

		onNumberChange: function( e ) {
			var $input = $( e.target );
			var value = parseInt( $input.val(), 10 );
			var min = $input.attr( 'min' );
			var max = $input.attr( 'max' );
			var attribute = $input.attr( 'data-bind' );

			if ( value < parseInt( min, 10 ) ) {
				$input.val( min );
				this.model.set( attribute, min );
			}

			if ( value > parseInt( max, 10 ) ) {
				$input.val( max );
				this.model.set( attribute, max );
			}
		},

		refreshPart: function() {
			var model = this.model;

			this.model.fetchHtml( function( response ) {
				var data = {
					id: model.get( 'id' ),
					html: response,
				};

				happyForms.previewSend( 'happyforms-form-part-refresh', data );
			} );
		},

		onPartPrefixChange: function( model, value ) {
			var data;

			/**
			 * If prefix is empty or had no value before, trigger part refresh so it hides / shows itself.
			 */
			if ( ! value || ! model.previous( 'prefix' ) ) {
				this.model.fetchHtml( function( response ) {
					data = {
						id: model.get( 'id' ),
						html: response,
					};

					happyForms.previewSend( 'happyforms-form-part-refresh', data );
				} );
			/**
			 * Otherwise, update prefix by part dom update in preview.
			 */
			} else {
				data = {
					id: this.model.get( 'id' ),
					callback: 'onPartPrefixChangeCallback',
				};

				happyForms.previewSend( 'happyforms-part-dom-update', data );
			}
		},

		onPartSuffixChange: function( model, value ) {
			var data;

			/**
			 * If suffix is empty or had no value before, trigger part refresh so it hides / shows itself.
			 */
			if ( ! value || ! model.previous( 'suffix' ) ) {
				this.model.fetchHtml( function( response ) {
					data = {
						id: model.get( 'id' ),
						html: response,
					};

					happyForms.previewSend( 'happyforms-form-part-refresh', data );
				} );
			/**
			 * Otherwise, update suffix by part dom update in preview.
			 */
			} else {
				data = {
					id: this.model.get( 'id' ),
					callback: 'onPartSuffixChangeCallback',
				};

				happyForms.previewSend( 'happyforms-part-dom-update', data );
			}
		},

	} );

	classes.views.FormSetup = classes.views.Base.extend( {
		template: '#happyforms-form-setup-template',

		events: _.extend( {}, classes.views.Base.prototype.events, {
			'keyup [data-attribute]': 'onInputChange',
			'change [data-attribute]': 'onInputChange',
			'change input[type=number]': 'onNumberChange',
		} ),

		pointers: {},

		editors: {
			'confirmation_message' : {},
			'error_message' : {},
		},

		initialize: function() {
			classes.views.Base.prototype.initialize.apply( this, arguments );

			this.listenTo( this.model, 'change:submit_button_label', this.onSubmitButtonLabelChange );
			this.listenTo( this.model, 'change:confirm_submission', this.onConfirmSubmissionChange );
		},

		render: function() {
			this.setElement( this.template( this.model.toJSON() ) );
			return this;
		},

		ready: function() {
			var self = this;

			this.setupHelpPointers();

			var defaultEditorSettings = {
				tinymce: {
					toolbar1: 'bold,italic,strikethrough,link',
					setup: this.onEditorInit.bind( this ),
				},
				quicktags: {
					buttons: 'strong,em,del,link,close'
				}
			};

			_.each( this.editors, function( editorSettings, editorId ) {
				var settings = _.extend( defaultEditorSettings, editorSettings );
				settings.tinymce.setup = self.onEditorInit.bind( self );

				self.initEditor( editorId, settings );
			} );

			this.setOptionalLabelVisibility();
		},

		initEditor: function( editorId, editorSettings ) {
			wp.editor.initialize( editorId, editorSettings );
		},

		onEditorInit: function( editor ) {
			var $textarea = $( '#' + editor.id, this.$el );
			var attribute = $textarea.data( 'attribute' );
			var self = this;

			editor.on( 'keyup change', function() {
				self.model.set( attribute, editor.getContent() );
			} );
		},

		onInputChange: function( e ) {
			e.preventDefault();

			var $el = $( e.target );
			var attribute = $el.data( 'attribute' );
			var value = $el.val();

			if ( $el.is( ':checkbox' ) ) {
				value = $el.is( ':checked' ) ? value: 0;

				if ( $el.is( ':checked' ) ) {
					$el.parents( '.customize-control' ).addClass( 'checked' );
				} else {
					$el.parents( '.customize-control' ).removeClass( 'checked' );
				}
			}

			$( '#customize-control-' + attribute ).attr( 'data-value', value );

			this.model.set( attribute, value );
		},

		onSubmitButtonLabelChange: function( model, value ) {
			happyForms.previewSend( 'happyforms-submit-button-text-update', value );
		},

		setOptionalLabelVisibility: function() {
			var optionalParts = this.model.get( 'parts' ).find( function( model, index, parts ) {
				return ( '' !== parts[index].get( 'required' ) && 1 !== parts[index].get( 'required' ) );
			} );

			if ( 'undefined' !== typeof optionalParts ) {
				$( '#customize-control-optional_part_label', this.$el ).show();
			}
		},

		onNumberChange: function( e ) {
			var $input = $( e.target );
			var value = parseInt( $input.val(), 10 );
			var min = $input.attr( 'min' );
			var max = $input.attr( 'max' );
			var attribute = $input.attr( 'data-bind' );

			if ( value < parseInt( min, 10 ) ) {
				$input.val( min );
				this.model.set( attribute, min );
			}

			if ( value > parseInt( max, 10 ) ) {
				$input.val( max );
				this.model.set( attribute, max );
			}
		},

		remove: function() {
			_.each( this.editors, function( editorSettings, editorId ) {
				wp.editor.remove( editorId );
			} );

			classes.views.Base.prototype.remove.apply( this, arguments );
		},

		onConfirmSubmissionChange: function( model, value ) {
			model.set( 'confirm_submission', 'success_message', { silent: true } );
		}
	} );

	classes.views.FormEmail = classes.views.FormSetup.extend( {
		template: '#happyforms-form-email-template',

		editors: {
			'confirmation_email_content' : {},
			'abandoned_resume_email_content' : {},
		},

		render: function() {
			classes.views.FormSetup.prototype.render.apply( this, arguments );

			this.applyConditionClasses();

			return this;
		},

		applyConditionClasses: function() {
			if ( this.model.get( 'allow_abandoned_resume' ) ) {
				this.$el.addClass( 'allow-abandoned-resume' );
			}

			var partClasses = happyForms.form
				.get( 'parts' )
				.pluck( 'type' )
				.map( function( type ) {
					return 'has-' + type;
				} )
				.join( ' ' );

			this.$el.addClass( partClasses );
		},
	} );

	classes.views.FormMessages = classes.views.FormSetup.extend( {
		template: '#happyforms-form-messages-template',

		events: _.extend( {}, classes.views.Base.prototype.events, {
			'keyup [data-attribute]': 'onInputChange',
			'change [data-attribute]': 'onInputChange',
			'keyup [data-attribute="optional_part_label"]': 'onOptionalPartLabelChange',
			'change [data-attribute="optional_part_label"]': 'onOptionalPartLabelChange',
			'keyup [data-attribute="required_field_label"]': 'onRequiredPartLabelChange',
			'change [data-attribute="required_field_label"]': 'onRequiredPartLabelChange',
			'keyup [data-attribute="submit_button_label"]': 'onSubmitButtonLabelChange',
			'change [data-attribute="submit_button_label"]': 'onSubmitButtonLabelChange',
			'focus .has-restore-default': 'showRestoreBtn',
			'click .restore-default-btn': 'resetValidationMessage',
			'keyup [data-attribute="words_label_min"]': 'onCharLimitMinWordsChange',
			'change [data-attribute="words_label_min"]': 'onCharLimitMinWordsChange',
			'keyup [data-attribute="words_label_max"]': 'onCharLimitMaxWordsChange',
			'change [data-attribute="words_label_max"]': 'onCharLimitMaxWordsChange',
			'keyup [data-attribute="characters_label_min"]': 'onCharLimitMinCharsChange',
			'change [data-attribute="characters_label_min"]': 'onCharLimitMinCharsChange',
			'keyup [data-attribute="characters_label_max"]': 'onCharLimitMaxCharsChange',
			'change [data-attribute="characters_label_max"]': 'onCharLimitMaxCharsChange',
			'keyup [data-attribute="no_results_label"]': 'onNoResultsLabelChange',
			'change [data-attribute="no_results_label"]': 'onNoResultsLabelChange',
			'keyup [data-attribute="submissions_left_label"]': 'onSubmissionsLeftLabelChange',
			'click [data-reset]': 'resetDefaultMessage',
			'keyup input[data-attribute]': 'onMessageValueChange',
		} ),

		editors: {
		},

		initialize: function() {
			classes.views.Base.prototype.initialize.apply( this, arguments );
		},

		render: function() {
			this.setElement( this.template( this.model.toJSON() ) );
			classes.views.FormSetup.prototype.render.apply( this, arguments );
			this.applyMsgConditionClasses();
			this.initializeResetButtons();

			return this;
		},

		initializeResetButtons: function() {
			var self = this;
			var $el = this.$el;

			$( '[data-reset]', $el ).each( function() {
				var attribute = $( this ).data( 'reset');

				self.setResetDisabled( attribute );
			} );
		},

		onMessageValueChange: function( e ) {
			var attribute = $( e.target ).data( 'attribute' );

			this.setResetDisabled( attribute );
		},

		setResetDisabled: function( attribute ) {
			var $el = this.$el;
			var $reset = $( '[data-reset="' + attribute + '"]', $el );

			var val_current = $( '[data-attribute="' + attribute + '"]', $el ).val();
			var val_default = $reset.data( 'default' );

			if ( val_current !== val_default ) {
				$reset.prop('disabled', false);
			} else {
				$reset.prop('disabled', true);
			}
		},

		resetDefaultMessage: function( e ) {
			var $reset = $( e.target );
			var attribute = $reset.data( 'reset' );
			var $input = $( '[data-attribute="' + attribute + '"]' );

			$input.val( $reset.data( 'default' ) );
			$reset.prop( 'disabled', true );

			$input.trigger( 'keyup' );
		},

		applyMsgConditionClasses: function() {
			var self = this;

			var partTypes = happyForms.form.get( 'parts' ).map( function( model ) {
				return model.get( 'type' );
			} );

			partTypes = _.union( partTypes );

			for ( var i = 0; i < partTypes.length; i++ ) {
				var className = 'has-' + partTypes[i];

				if ( self.$el.hasClass( className ) ) {
					className = className + '-part';
				}

				self.$el.addClass( className );
			}

			var hasRequiredFields = happyForms.form.get( 'parts' ).findWhere( {
				required: 1
			} );

			if ( hasRequiredFields ) {
				self.$el.addClass( 'has-required-field' );
			}

			var hasRequiredTextFields = this.model.get( 'parts' ).find( function( part ) {
				var types = [ 'single_line_text', 'multi_line_text', 'email',  'number' ];
				var required = part.get( 'required' );

				if ( required == 1 ) {
					var type = part.get( 'type' );
					return ( $.inArray( type, types ) > -1 );
				}

				return false;
			} );

			if ( hasRequiredTextFields ) {
				self.$el.addClass( 'has-required-text-fields' );
			}

			var hasRequiredSelectionField = this.model.get( 'parts' ).find( function( part ) {
				var types = [ 'radio', 'checkbox', 'select' ];
				var required = part.get( 'required' );

				if ( required == 1 ) {
					var type = part.get( 'type' );
					return ( $.inArray( type, types ) > -1 );
				}

				return false;
			} );

			if ( hasRequiredSelectionField ) {
				self.$el.addClass( 'has-required-selection-fields' );
			}

			if ( happyForms.form.get( 'parts' ).length > 0 ) {
				self.$el.addClass( 'has-field' );
			}

			var optionalPart = this.model.get( 'parts' ).find( function( part ) {
				var part_required = part.get( 'required' );

				return ( part_required == 0 || part_required == '' );
			} );

			if ( optionalPart ) {
				self.$el.addClass( 'has-optional-field' );
			}

			var hasConfirmField = happyForms.form.get( 'parts' ).findWhere( {
				confirmation_field: 1
			} );

			if ( hasConfirmField ) {
				self.$el.addClass( 'has-confirm-field' );
			}

			var confirmSubmission = happyForms.form.get( 'confirm_submission' );

			if ( confirmSubmission == 'success_message_hide_form' || confirmSubmission == 'success_message' ) {
				self.$el.addClass( 'is-show-success-msg' );
			}

			var hasMinWords = happyForms.form.get( 'parts' ).findWhere( {
				limit_input: 1,
				character_limit_mode: 'word_min'
			} );

			if ( hasMinWords ) {
				self.$el.addClass( 'has-min-words-label' );
			}

			var hasMaxWords = happyForms.form.get( 'parts' ).findWhere( {
				limit_input: 1,
				character_limit_mode: 'word_max'
			} );

			if ( hasMaxWords ) {
				self.$el.addClass( 'has-max-words-label' );
			}

			var hasMinChars = happyForms.form.get( 'parts' ).findWhere( {
				limit_input: 1,
				character_limit_mode: 'character_min'
			} );

			if ( hasMinChars ) {
				self.$el.addClass( 'has-min-chars-label' );
			}

			var hasMaxChars = happyForms.form.get( 'parts' ).findWhere( {
				limit_input: 1,
				character_limit_mode: 'character_max'
			} );

			if ( hasMaxChars ) {
				self.$el.addClass( 'has-max-chars-label' );
			}

			var showMsgShortLabel = happyForms.form.get( 'parts' ).find( function( part ) {
				var limit_mode = part.get( 'character_limit_mode' );

				if ( limit_mode ) {
					if ( part.get( 'limit_input' ) == 1 && ( limit_mode == 'character_min' || limit_mode == 'word_min' ) &&
						part.get( 'character_limit' ) > 1 ) {
						return true;
					}
				}
			} );

			if ( showMsgShortLabel ) {
				self.$el.addClass( 'show-msg-short-label' );
			}

			var hasSearchableDropdown = happyForms.form.get( 'parts' ).findWhere( {
				allow_search: 1
			} );

			if ( hasSearchableDropdown ) {
				self.$el.addClass( 'has-searchable-dropdown' );
			}


			var partsWithLimitedOptions = happyForms.form.get( 'parts' ).filter( function( part ) {
			var hasOptions = [ 'radio', 'checkbox', 'select' ].includes( part.get( 'type' ) );
			if ( ! hasOptions ) {
				return false;
			}
			var hasLimitedOptions = part.get( 'options' ).findWhere( {
				show_submissions_amount: "1"
			} );
			if ( hasLimitedOptions ) {
				return hasLimitedOptions;
			}
			return false;
			} );

			if ( partsWithLimitedOptions.length ) {
				self.$el.addClass( 'has-show-submissions-left' );
			}

		},

		ready: function() {
			var self = this;
			this.$inputRestoreBtns = $( '.restore-default-btn' );

			var defaultEditorSettings = {
			};

		},


		onSubmitButtonLabelChange: function( e ) {

			happyForms.previewSend( 'happyforms-submit-button-text-update', $( e.target ).val() );
		},

		onOptionalPartLabelChange: function( e ) {
			var data = {
				callback: 'onOptionalPartLabelChangeCallback',
			};

			happyForms.previewSend( 'happyforms-form-dom-update', data );
		},

		onRequiredPartLabelChange: function( e ) {
			var data = {
				callback: 'onRequiredPartLabelChangeCallback',
			};

			happyForms.previewSend( 'happyforms-form-dom-update', data );
		},

		onCharLimitMinWordsChange: function ( e ) {
			var data = {
				callback: 'onCharLimitMinWordsChangeCallback',
			};

			happyForms.previewSend( 'happyforms-form-dom-update', data );
		},

		onCharLimitMaxWordsChange: function ( e ) {
			var data = {
				callback: 'onCharLimitMaxWordsChangeCallback',
			};

			happyForms.previewSend( 'happyforms-form-dom-update', data );
		},

		onCharLimitMinCharsChange: function ( e ) {
			var data = {
				callback: 'onCharLimitMinCharsChangeCallback',
			};

			happyForms.previewSend( 'happyforms-form-dom-update', data );
		},

		onCharLimitMaxCharsChange: function ( e ) {
			var data = {
				callback: 'onCharLimitMaxCharsChangeCallback',
			};

			happyForms.previewSend( 'happyforms-form-dom-update', data );
		},
		onNoResultsLabelChange: function( e ) {
			var data = {
				callback: 'onNoResultsLabelChangeCallback',
			};

			happyForms.previewSend( 'happyforms-form-dom-update', data );
		},
		onSubmissionsLeftLabelChange: function( e ) {
			var data = {
				callback: 'onSubmissionsLeftLabelChangeCallback',
			};

			happyForms.previewSend( 'happyforms-form-dom-update', data );
		},		
	} );

	classes.views.FormStyle = classes.views.Base.extend( {
		template: '#happyforms-form-style-template',

		events: _.extend( {}, classes.views.Base.prototype.events, {
			'change [data-attribute]': 'onAttributeChange',
			'click h3.accordion-section-title': 'onGroupClick',
			'click .customize-panel-back': 'onGroupBackClick',
			'change [data-target="form_class"]': 'onFormClassChange',
			'change [data-target="css_var"] input[type=radio]': 'onRadioChange',
			'navigate-to-group': 'navigateToGroup',
		} ),

		pointers: {},

		initialize: function() {
			classes.views.Base.prototype.initialize.apply( this, arguments );

			this.listenTo( this.model, 'change:additional_css', _.debounce( function( model, value ) {
				this.onAdditionalCSSChange( model, value );
			}, 500 ) );
			this.listenTo( this.model, 'change:form_title', this.onChangeTitleDisplay );
			this.listenTo( this.model, 'change:part_description_mode', this.onChangeGlobalDescriptionMode );

			this.styles = new Backbone.Collection();
		},

		render: function() {
			this.setElement( this.template( this.model.toJSON() ) );
			this.applyConditionClasses();
			return this;
		},

		onAdditionalCSSChange: function( model, value ) {
			happyForms.form.fetchCustomCSS( function( response ) {
				api.previewer.send( 'happyforms-custom-css-updated', response );
			} );
		},

		applyConditionClasses: function() {
			var self = this;

			var partTypes = happyForms.form.get( 'parts' ).map( function( model ) {
				return model.get( 'type' );
			} );

			partTypes = _.union( partTypes );

			for ( var i = 0; i < partTypes.length; i++ ) {
				var className = 'has-' + partTypes[i];

				if ( self.$el.hasClass( className ) ) {
					className = className + '-part';
				}

				self.$el.addClass( className );
			}

			var hasSubmitInline = ( happyForms.form.get( 'captcha' ) != '1' )
				&& ( happyForms.form.get( 'parts' ).findLastIndex( { width: 'auto' } ) !== -1 );

			if ( hasSubmitInline ) {
				this.$el.addClass( 'has-submit-inline' );
			}
		},

		ready: function() {
			this.initColorPickers();
			this.initUISliders();
			this.setupHelpPointers();
			this.initCodeEditors();

			if ( happyForms.savedStates.style.activeSection ) {
				this.navigateToGroup( happyForms.savedStates.style.activeSection );
			}

			$( '.happyforms-style-controls-group' ).on( 'scroll', function() {
				happyForms.savedStates.style.scrollTop = $( this ).scrollTop();
			} );
		},

		setScrollPosition: function() {
			$( '.happyforms-style-controls-group.open', this.$el ).scrollTop( happyForms.savedStates.style.scrollTop );
		},

		onFormClassChange: function( e ) {
			e.preventDefault();

			var data = {
				attribute: $( e.target ).data( 'attribute' ),
				callback: 'onFormClassChangeCallback',
			};

			happyForms.previewSend( 'happyforms-form-class-update', data );
		},

		onChangeGlobalDescriptionMode: function( model, value ) {
			this.refreshFormParts( 'description_mode', value );
		},

		refreshFormParts: function( partAttribute, value ) {
			happyForms.form.get( 'parts' ).forEach( function( $partModel ) {
				$partModel.set( partAttribute, value );
			} );

			happyForms.form.get( 'parts' ).fetchHtml( function( response ) {
				happyForms.previewSend( 'happyforms-form-parts-refresh', response );
			} );
		},

		onChangeTitleDisplay: function() {
			var data = {
				attribute: 'form_title',
				callback: 'onFormClassChangeCallback',
			};

			happyForms.previewSend( 'happyforms-form-class-update', data );
		},

		onRadioChange: function( e ) {
			e.preventDefault();

			var $target = $( e.target );
			var attribute = $target.data( 'attribute' );
			var variable = $target.parents( '.happyforms-buttonset-control' ).data( 'variable' );

			var value = $target.val();

			var data = {
				variable: variable,
				value: value,
			};

			happyForms.previewSend( 'happyforms-css-variable-update', data );
		},

		onAttributeChange: function( e ) {
			e.preventDefault();

			var $target = $( e.target );
			var attribute = $target.data( 'attribute' );
			var value = $target.val();

			if ( $target.is( ':checkbox' ) ) {
				value = $target.is( ':checked' ) ? value : '';
			}

			happyForms.form.set( attribute, value );
		},

		onGroupClick: function( e ) {
			e.preventDefault();

			var self = this;

			$( '.happyforms-style-controls-group', this.$el ).removeClass( 'open' ).addClass( 'animate' );

			setTimeout( function() {
				$( '.happyforms-divider-control', this.$el )
					.removeClass( 'active' )
					.addClass( 'inactive' );

				var $linkTab = $( e.target ).parent();
				var $group = $linkTab.next();

				$group.addClass( 'open' );
				self.setScrollPosition();

				happyForms.savedStates.style.activeSection = $linkTab.attr( 'id' );
			}, 200 );
		},

		onGroupBackClick: function( e ) {
			e.preventDefault();

			$( '.happyforms-divider-control', this.$el )
				.removeClass( 'inactive' )
				.addClass( 'active' );

			var $section = $( e.target ).closest( '.happyforms-style-controls-group' );

			$section.addClass( 'closing' );

			setTimeout(function () {
				$section.removeClass('closing open');
			}, 200);

			happyForms.savedStates.style.activeSection = '';
			happyForms.savedStates.style.scrollTop = 0;
		},

		navigateToGroup: function( groupID ) {
			if ( ! groupID ) {
				return;
			}

			var $group = $( '#' + groupID, this.$el );

			if ( ! $group.length ) {
				return;
			}

			$( '.happyforms-style-controls-group', this.$el ).removeClass( 'open' );

			$( '.happyforms-divider-control', this.$el )
				.removeClass( 'active' )
				.addClass( 'inactive' );

			$group.next().removeClass( 'animate' ).addClass( 'open' );

			this.setScrollPosition();
		},

		initColorPickers: function() {
			var self = this;
			var $colorInputs = $( '.happyforms-color-input', this.$el );

			$colorInputs.each( function( index, el ) {
				var $control = $( el ).parents( '.customize-control' );
				var variable = $control.data( 'variable' );

				$( el ).wpColorPicker( {
					defaultColor: $( el ).attr( 'data-default' ),
					change: function( e, ui ) {
						var value = ui.color.toString();

						self.model.set( $( el ).attr( 'data-attribute' ), value );

						var data = {
							variable: variable,
							value: value,
						};

						happyForms.previewSend( 'happyforms-css-variable-update', data );
					}
				} );

				var $wpPickerContainer = $( el ).parent().parent();

				$wpPickerContainer.find( '.wp-picker-clear' ).on( 'click', function() {
					var attribute = $( el ).attr( 'data-attribute' );
					var value = $( el ).attr( 'data-default' );

					self.model.set( attribute, value );
				} );
			} );
		},

		initUISliders: function() {
			var self = this;
			var $container = this.$el.find( '.happyforms-range-control, .happyforms-form-width-range-control, .happyforms-form_title-range-control' );

			$container.each( function( index, el ) {
				var $this = $(this);
				var variable = $this.data('variable');
				var $sliderInput = $( 'input[type=range]', $this );

				$sliderInput.on( 'change', function() {
					var $this = $(this);

					self.model.set( $sliderInput.attr( 'data-attribute' ), $this.val() );

					var data = {
						variable: variable,
						value: $this.val() + $( el ).attr( 'data-unit' ),
					};

					happyForms.previewSend( 'happyforms-css-variable-update', data );
				});
			} );
		},

		initCodeEditors: function() {
			if ( ! $( '.happyforms-code-control', this.$el ).length ) {
				return;
			}

			var self = this;

			$( '.happyforms-code-control', this.$el ).each( function() {
				var $this = $( this );
				var $el = $( 'textarea', $this );

				if ( 'rich' === $this.attr( 'data-mode' ) ) {
					self.initSyntaxHighlightingEditor( $el );
				} else {
					self.initPlainTextEditor( $el );
				}
			} );
		},

		initSyntaxHighlightingEditor: function( $el ) {
			var self = this;
			var attribute = $el.attr( 'data-attribute' );

			var editor = wp.codeEditor.initialize(
				$el.attr( 'id' ),
				{
					csslint: {
						"errors": true,
						"box-model": true,
						"display-property-grouping": true,
						"duplicate-properties": true,
						"known-properties": true,
						"outline-none": true
					},
					codemirror: {
						"mode": $el.attr( 'data-mode' ),
						"lint": true,
						"lineNumbers": true,
						"styleActiveLine": true,
						"indentUnit": 2,
						"indentWithTabs": true,
						"tabSize": 2,
						"lineWrapping": true,
						"autoCloseBrackets": true,
						"matchBrackets": true,
						"continueComments": true,
						"extraKeys": {
							"Ctrl-Space": "autocomplete",
							"Ctrl-\/": "toggleComment",
							"Cmd-\/": "toggleComment",
							"Alt-F": "findPersistent",
							"Ctrl-F": "findPersistent",
							"Cmd-F": "findPersistent"
						},
						"direction": "ltr",
						"gutters": [ "CodeMirror-lint-markers" ],
					}
				}
			);

			editor.codemirror.on( 'change', function() {
				var value = editor.codemirror.getValue();

				self.model.set( attribute, value );
			} );
		},

		initPlainTextEditor: function( $el ) {
			var self = this;
			var attribute = $el.attr( 'data-attribute' );

			$el.on( 'blur', function onBlur() {
				$el.data( 'next-tab-blurs', false );
			} );

			$el.on( 'keydown', function onKeydown( event ) {
				var selectionStart, selectionEnd, value, tabKeyCode = 9, escKeyCode = 27;

				if ( escKeyCode === event.keyCode ) {
					if ( ! $el.data( 'next-tab-blurs' ) ) {
						$el.data( 'next-tab-blurs', true );
						event.stopPropagation(); // Prevent collapsing the section.
					}
					return;
				}

				// Short-circuit if tab key is not being pressed or if a modifier key *is* being pressed.
				if ( tabKeyCode !== event.keyCode || event.ctrlKey || event.altKey || event.shiftKey ) {
					return;
				}

				// Prevent capturing Tab characters if Esc was pressed.
				if ( $el.data( 'next-tab-blurs' ) ) {
					return;
				}

				selectionStart = $el[0].selectionStart;
				selectionEnd = $el[0].selectionEnd;
				value = $el[0].value;

				if ( selectionStart >= 0 ) {
					$el[0].value = value.substring( 0, selectionStart ).concat( '\t', value.substring( selectionEnd ) );
					$el.selectionStart = $el[0].selectionEnd = selectionStart + 1;
				}

				event.stopPropagation();
				event.preventDefault();
			});

			$el.on( 'keyup', function( e ) {
				self.model.set( attribute, $( e.target ).val() );
			} );
		}
	} );

	Previewer = {
		$: $,
		ready: false,

		getPartModel: function( id ) {
			return happyForms.form.get( 'parts' ).get( id );
		},

		getPartElement: function( html ) {
			return this.$( html );
		},

		bind: function() {
			this.ready = true;

			// Form title pencil
			api.previewer.bind(
				'happyforms-title-pencil-click',
				this.onPreviewPencilClickTitle.bind( this )
			);

			// Part pencils
			api.previewer.bind(
				'happyforms-pencil-click-part',
				this.onPreviewPencilClickPart.bind( this )
			);
		},

		/**
		 *
		 * Previewer callbacks for pencils
		 *
		 */
		onPreviewPencilClickPart: function( id ) {
			happyForms.navigate( 'build', { trigger: true } );

			var $partWidget = $( '[data-part-id="' + id + '"]' );

			if ( ! $partWidget.hasClass( 'happyforms-widget-expanded' ) ) {
				$partWidget.find( '.toggle-indicator' ).trigger( 'click' );
			}

			$( 'input', $partWidget ).first().trigger( 'focus' );
		},

		onPreviewPencilClickTitle: function( id ) {
			happyForms.navigate( 'build', { trigger: true } );

			$( 'input[name="post_title"]' ).trigger( 'focus' );
		},

		onOptionalPartLabelChangeCallback: function( $form ) {
			var optionalLabel = happyForms.form.get( 'optional_part_label' );
			$( '.happyforms-optional', $form ).text( optionalLabel );
		},

		onRequiredPartLabelChangeCallback: function( $form ) {
			var requiredLabel = happyForms.form.get( 'required_field_label' );
			$( '.happyforms-required', $form ).text( requiredLabel );
		},

		onCharLimitMinWordsChangeCallback: function( $form ) {
			var label = happyForms.form.get( 'words_label_min' );
			$( '.happyforms-part__char-counter.word_min span.counter-label', $form ).text( label );
		},

		onCharLimitMaxWordsChangeCallback: function( $form ) {
			var label = happyForms.form.get( 'words_label_max' );
			$( '.happyforms-part__char-counter.word_max span.counter-label', $form ).text( label );
		},

		onCharLimitMinCharsChangeCallback: function( $form ) {
			var label = happyForms.form.get( 'characters_label_min' );
			$( '.happyforms-part__char-counter.character_min span.counter-label', $form ).text( label );
		},

		onCharLimitMaxCharsChangeCallback: function( $form ) {
			var label = happyForms.form.get( 'characters_label_max' );
			$( '.happyforms-part__char-counter.character_max span.counter-label', $form ).text( label );
		},

		onNoResultsLabelChangeCallback: function( $form ) {
			var label = happyForms.form.get( 'no_results_label' );

			$( 'li.happyforms-custom-select-dropdown__not-found', $form ).text( label );
		},

		/**
		 *
		 * Previewer callbacks for live part DOM updates
		 *
		 */
		onPartMouseOverCallback: function( id, html ) {
			var $part = this.$( html );
			$part.addClass( 'highlighted' );
		},

		onPartMouseOutCallback: function( id, html ) {
			var $part = this.$( html );
			$part.removeClass( 'highlighted' );
		},

		onPartLabelChangeCallback: function( id, html ) {
			var part = happyForms.form.get( 'parts' ).get( id );
			var $part = this.$( html );
			var $label = this.$( '.happyforms-part-wrap > .happyforms-part__label-container span.label', $part ).first();

			$label.text( part.get( 'label' ) );
		},

		onRequiredCheckboxChangeCallback: function( id, html ) {
			var part = happyForms.form.get( 'parts' ).get( id );
			var $part = this.$( html );
			var required = part.get( 'required' );
			var optionalLabel = happyForms.form.get( 'optional_part_label' );
			var requiredLabel = happyForms.form.get( 'required_field_label' );

			if ( 0 === parseInt( required, 10 ) ) {
				$part.removeAttr( 'data-happyforms-required' );
				$( '.happyforms-optional', $part ).text( optionalLabel );
			} else {
				$( '.happyforms-required', $part ).text( requiredLabel );
				$part.attr( 'data-happyforms-required', '' );
			}
		},

		onPartWidthChangeCallback: function( id, html, options ) {
			var part = happyForms.form.get( 'parts' ).get( id );
			var $part = this.$( html );
			var width = part.get( 'width' );

			$part.removeClass( 'happyforms-part--width-half' );
			$part.removeClass( 'happyforms-part--width-full' );
			$part.removeClass( 'happyforms-part--width-third' );
			$part.removeClass( 'happyforms-part--width-quarter' );
			$part.removeClass( 'happyforms-part--width-auto' );
			$part.addClass( 'happyforms-part--width-' + width );
		},

		onPlaceholderChangeCallback: function( id, html ) {
			var part = happyForms.form.get( 'parts' ).get( id );
			var $part = this.$( html );

			this.$( 'input:not([type="hidden"])', $part ).first().attr( 'placeholder', part.get( 'placeholder' ) );
		},

		onDescriptionChangeCallback: function( id, html ) {
			var part = happyForms.form.get( 'parts' ).get( id );
			var $part = this.$( html );
			var description = part.get('description');
			var $description = this.$( '.happyforms-part__description', $part );

			$description.text(description);
		},

		onDefaultValueChangeCallback: function( id, $part ) {
			var part = happyForms.form.get( 'parts' ).get( id );
			var default_value = part.get( 'default_value' );

			$part.find( ':input' ).val( default_value );

			if ( part.get( 'rich_text' ) ) {
				var instance = $part.data( 'HappyFormPart' );

				instance.editor.setContent( default_value );
			}			
		},

		onDescriptionModeChangeCallback: function( id, html ) {
			var part = happyForms.form.get( 'parts' ).get( id );
			var $part = this.$( html );
			var $description = this.$( '.happyforms-tooltip + .happyforms-part__description', $part );
			var $tooltip = this.$( '.happyforms-part__tooltip', $part );

			switch( part.get( 'description_mode' ) ) {
				case 'focus-reveal':
					$tooltip.hide();
					$description.show();
					$part.addClass('happyforms-part--focus-reveal-description');
					break;
				case 'tooltip':
					$tooltip.show();
					$description.hide();
					$part.removeClass('happyforms-part--focus-reveal-description');
					break;
				case '':
				default:
					$tooltip.hide();
					$description.show();
					$part.removeClass('happyforms-part--focus-reveal-description');
					break;
			}
		},

		onLabelPlacementChangeCallback: function( id, html, options ) {
			var part = happyForms.form.get( 'parts' ).get( id );
			var $part = this.$( html );

			$part.removeClass( 'happyforms-part--label-above' );
			$part.removeClass( 'happyforms-part--label-below' );
			$part.removeClass( 'happyforms-part--label-left' );
			$part.removeClass( 'happyforms-part--label-right' );
			$part.removeClass( 'happyforms-part--label-inside' );
			$part.addClass( 'happyforms-part--label-' + part.get( 'label_placement' ) );
		},

		onCSSClassChangeCallback: function( id, html, options ) {
			var part = happyForms.form.get( 'parts' ).get( id );
			var $part = this.$( html );
			var previousClass = part.previous( 'css_class' );
			var currentClass = part.get( 'css_class' );

			$part.removeClass( previousClass );
			$part.addClass( currentClass );
		},

		onSubPartAdded: function( id, partHTML, optionHTML ) {
			var partView = happyForms.sidebar.current.partViews.get( id ).get( 'view' );
			partView.onSubPartAdded( id, partHTML, optionHTML );
		},

		onFormClassChangeCallback: function( attribute, html, options ) {
			var $formContainer = this.$( html );
			var previousClass = happyForms.form.previous( attribute );
			var currentClass = happyForms.form.get( attribute );

			$formContainer.removeClass( previousClass );
			$formContainer.addClass( currentClass );

			api.previewer.send( 'happyforms-form-class-updated' );
		},

		onFormClassToggleCallback: function( attribute, html, options ) {
			var $formContainer = this.$( html );
			var previousClass = happyForms.form.previous( attribute );
			var currentClass = happyForms.form.get( attribute );

			$formContainer.removeClass( previousClass );
			$formContainer.addClass( currentClass );
		},

		onFocusRevealDescriptionCallback: function( id, html, options ) {
			var part = happyForms.form.get( 'parts' ).get( id );
			var $part = this.$( html );
			var focusRevealDescription = part.get('focus_reveal_description');

			if ( 1 == focusRevealDescription ) {
				$part.addClass( 'happyforms-part--focus-reveal-description' );
			} else {
				$part.removeClass( 'happyforms-part--focus-reveal-description' );
			}
		},

		onPartPrefixChangeCallback: function( id, html, options, $ ) {
			var part = this.getPartModel( id );
			var $part = this.getPartElement( html );
			var $prefix = this.$( '.happyforms-input-group__prefix span', $part );

			$prefix.text( part.get( 'prefix' ) );
		},

		onPartSuffixChangeCallback: function( id, html, options, $ ) {
			var part = this.getPartModel( id );
			var $part = this.getPartElement( html );
			var $suffix = this.$( '.happyforms-input-group__suffix span', $part );

			$suffix.text( part.get( 'suffix' ) );
		},
		onSubmissionsLeftLabelChangeCallback: function( $form ) {
			var submissionsLeftLabel = happyForms.form.get( 'submissions_left_label' );
			$( '.happyforms-submissions-left', $form ).text( submissionsLeftLabel );
		},		
	};

	happyForms = window.happyForms = new HappyForms();
	happyForms.classes = classes;
	happyForms.factory = PartFactory;
	happyForms.previewer = Previewer;

	happyForms.utils = {
		uniqueId: function( prefix, collection ) {
			if ( collection ) {
				var increments = collection
					.pluck( 'id' )
					.map( function( id ) {
						var numberId = id.match( /_(\d+)$/ );
						numberId = numberId !== null ? parseInt( numberId[1] ): 0;
						return numberId;
					} )
					.sort( function( a, b ) {
						return b - a;
					} );

				var increment = increments.length ? increments[0] + 1 : 1;

				return prefix + increment;
			}

			return _.uniqueId( prefix );
		},

		fetchPartialHtml: function( partialName, success ) {
			var data = {
				action: 'happyforms-form-fetch-partial-html',
				'happyforms-nonce': api.settings.nonce.happyforms,
				happyforms: 1,
				wp_customize: 'on',
				form_id: happyForms.form.id,
				form: JSON.stringify( happyForms.form.toJSON() ),
				partial_name: partialName
			};

			var request = $.ajax( ajaxurl, {
				type: 'post',
				dataType: 'html',
				data: data
			} );

			happyForms.previewSend( 'happyforms-form-partial-disable', {
				partial: partialName
			} );

			request.done( success );
		},

		unprefixOptionId: function( optionId ) {
			var split = optionId.split( '_' );
			var numericPart = _(split).last();

			return numericPart;
		}
	};

	api.bind( 'ready', function() {
		happyForms.start();

		api.previewer.bind( 'ready', function() {
			happyForms.flushBuffer();
			happyForms.previewer.bind();
		} );
	} );

	happyForms.factory.model = _.wrap( happyForms.factory.model, function( func, attrs, options, BaseClass ) {
		BaseClass = happyForms.classes.models.parts[attrs.type];

		return func( attrs, options, BaseClass );
	} );

	happyForms.factory.view = _.wrap( happyForms.factory.view, function( func, options, BaseClass ) {
		BaseClass = happyForms.classes.views.parts[options.type];

		return func( options, BaseClass );
	} );

} ) ( jQuery, _, Backbone, wp.customize, _happyFormsSettings );
