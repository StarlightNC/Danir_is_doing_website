( function( $, _, Backbone, api, settings ) {

	happyForms.classes.models.parts.radio = happyForms.classes.models.Part.extend( {
		defaults: function() {
			return _.extend(
				{},
				settings.formParts.radio.defaults,
				_.result( happyForms.classes.models.Part.prototype, 'defaults' ),
			);
		},

		initialize: function( attrs, options ) {
			happyForms.classes.models.Part.prototype.initialize.apply( this, arguments );

			this.attributes.options = new OptionCollection( this.get( 'options' ), options );
		},

		toJSON: function() {
			var json = Backbone.Model.prototype.toJSON.apply( this, arguments );
			json.options = json.options.toJSON();

			return json;
		},
	} );

	var OptionModel = Backbone.Model.extend( {
		defaults: {
			is_default: false,
			label: '',
			description: '',
		},
	} );

	var OptionCollection = Backbone.Collection.extend( {
		model: OptionModel,
	} );

	happyForms.classes.views.parts.radioOption = Backbone.View.extend( {
		template: '#customize-happyforms-radio-item-template',

		events: {
			'click .advanced-option': 'onAdvancedOptionClick',
			'click .delete-option': 'onDeleteOptionClick',
			'keyup [name=label]': 'onItemLabelChange',
			'change [name=label]': 'onItemLabelChange',
			'keyup [name=description]': 'onItemDescriptionChange',
			'change [name=is_default]': 'onItemDefaultChange',

			'change [name=limit_submissions]': 'onItemLimitSubmissionsChange',
			'keyup [name=limit_submissions_amount]': 'onItemLimitSubmissionsAmountChange',
			'change [name=limit_submissions_amount]': 'onItemLimitSubmissionsAmountChange',
			'change [name=show_submissions_amount]': 'onItemLimitShowSubmissionsAmountChange',
		},

		initialize: function( options ) {
			this.template = _.template( $( this.template ).text() );
			this.part = options.part;

			this.listenTo( this, 'ready', this.onReady );

			this.listenTo( this.model, 'change:show_submissions_amount', this.onChangeShowSubmissions );
			this.listenTo( this.model, 'change:limit_submissions_amount', this.onChangeMaxSubmissionsAmount );
		},

		render: function() {
			this.setElement( this.template( this.model.toJSON() ) );
			return this;
		},

		onReady: function() {
			$( '[name=label]', this.$el ).trigger( 'focus' );
		},

		onAdvancedOptionClick: function( e ) {
			e.preventDefault();

			$( '.happyforms-part-item-advanced', this.$el ).slideToggle( 300, function() {
				$( e.target ).toggleClass( 'opened' );
			} );
		},

		onDeleteOptionClick: function( e ) {
			e.preventDefault();
			this.model.collection.remove( this.model );
		},

		onItemLabelChange: function( e ) {
			this.model.set( 'label', $( e.target ).val() );
			this.part.trigger( 'change' );

			var data = {
				id: this.part.get( 'id' ),
				callback: 'onRadioItemLabelChangeCallback',
				options: {
					itemID: this.model.get( 'id' ),
				}
			};

			happyForms.previewSend( 'happyforms-part-dom-update', data );
		},

		onItemDescriptionChange: function( e ) {
			this.model.set( 'description', $( e.target ).val() );
			this.part.trigger( 'change' );

			var data = {
				id: this.part.get( 'id' ),
				callback: 'onRadioItemDescriptionChangeCallback',
				options: {
					itemID: this.model.get( 'id' ),
				}
			};

			happyForms.previewSend( 'happyforms-part-dom-update', data );
		},

		onItemDefaultChange: function( e ) {
			var isChecked = $( e.target ).is( ':checked' );

			this.model.collection.forEach( function( item ) {
				item.set( 'is_default', 0 );
			} );

			$( '[name=is_default]', this.$el.siblings() ).prop( 'checked', false );

			if ( isChecked ) {
				this.model.set( 'is_default', 1 );
				$( e.target ).prop( 'checked', true );
			}

			var data = {
				id: this.part.get( 'id' ),
				callback: 'onRadioItemDefaultChangeCallback',
				options: {
					itemID: this.model.get( 'id' ),
				}
			};

			happyForms.previewSend( 'happyforms-part-dom-update', data );
		},

		onItemLimitSubmissionsChange: function( e ) {
			var isChecked = $( e.target ).is( ':checked' );

			if ( ! isChecked ) {
				this.model.set( 'show_submissions_amount', 0 );
				$( "input[name='show_submissions_amount']", this.$el ).prop('checked',false);;
			}

			this.model.set( 'limit_submissions', isChecked ? 1 : 0 );
			$( '.happyforms-part-item-limit-submission-settings', this.$el ).toggle();
		},

		onChangeShowSubmissions: function( e ) {

			var model = this.part;

			this.part.fetchHtml( function( response ) {
				var data = {
					id: model.get( 'id' ),
					html: response,
				};

				happyForms.previewSend( 'happyforms-form-part-refresh', data );

			} );
		},

		onChangeMaxSubmissionsAmount: function( e ) {

			var model = this.part;

			if ( 1 != this.model.get('show_submissions_amount') ) {
				return;
			}

			this.part.fetchHtml( function( response ) {
				var data = {
					id: model.get( 'id' ),
					html: response,
				};

				happyForms.previewSend( 'happyforms-form-part-refresh', data );

			} );
		},

		onItemLimitSubmissionsAmountChange: function( e ) {
			this.model.set( 'limit_submissions_amount', $( e.target ).val() );
			this.part.trigger( 'change' );
		},

		onItemLimitShowSubmissionsAmountChange: function( e ) {
			var isChecked = $( e.target ).is( ':checked' );

			this.model.set( 'show_submissions_amount', isChecked ? "1" : 0 );
			this.part.trigger( 'change' );
		},

	} );

	happyForms.classes.views.parts.radio = happyForms.classes.views.Part.extend( {
		template: '#customize-happyforms-radio-template',

		events: _.extend( {}, happyForms.classes.views.Part.prototype.events, {
			'click .add-option': 'onAddOptionClick',
			'click .import-option': 'onImportOptionClick',
			'click .import-options': 'onImportOptionsClick',
			'click .add-options': 'onAddOptionsClick',
			'change [name=display_type]': 'onDisplayTypeChange',
			'keyup [name=label]': 'onEnterKey',
			'keyup [name=description]': 'onEnterKey',
		} ),

		initialize: function() {
			happyForms.classes.views.Part.prototype.initialize.apply( this, arguments );

			this.optionViews = new Backbone.Collection();

			this.listenTo( this.model.get( 'options' ), 'add', this.onOptionModelAdd );
			this.listenTo( this.model.get( 'options' ), 'change', this.onOptionModelChange );
			this.listenTo( this.model.get( 'options' ), 'remove', this.onOptionModelRemove );
			this.listenTo( this.model.get( 'options' ), 'reset', this.onOptionModelsSorted );
			this.listenTo( this.optionViews, 'add', this.onOptionViewAdd );
			this.listenTo( this.optionViews, 'remove', this.onOptionViewRemove );
			this.listenTo( this.optionViews, 'reset', this.onOptionViewsSorted );
			this.listenTo( this, 'sort-stop', this.onOptionSortStop );
			this.listenTo( this, 'ready', this.onReady );

			this.listenTo( this.model, 'change:other_option', this.onAddOtherOption );
			this.listenTo( this.model, 'change:other_option_label', this.onOtherOptionLabelChange );
			this.listenTo( this.model, 'change:other_option_placeholder', this.onOtherOptionPlaceholderChange );
		},

		onReady: function() {
			this.model.get( 'options' ).each( function( optionModel ) {
				this.addOptionView( optionModel );
			}, this );

			$( '.option-list', this.$el ).sortable( {
				handle: '.happyforms-part-item-handle',
				helper: 'clone',

				stop: function ( e, ui ) {
					this.trigger( 'sort-stop', e, ui );
				}.bind( this ),
			} );
		},

		onOptionModelAdd: function( optionModel, optionsCollection, options ) {
			this.model.trigger( 'change' );
			this.addOptionView( optionModel, options );

			var model = this.model;

			if ( options.refresh !== false ) {
				this.model.fetchHtml( function( response ) {
					var data = {
						id: model.get( 'id' ),
						html: response,
					};

					happyForms.previewSend( 'happyforms-form-part-refresh', data );
				} );
			}
		},

		onOptionModelChange: function( optionModel ) {
			this.model.trigger( 'change' );
		},

		onOptionModelRemove: function( optionModel ) {
			this.model.trigger( 'change' );

			var optionViewModel = this.optionViews.find( function( viewModel ) {
				return viewModel.get( 'view' ).model.id === optionModel.id;
			}, this );

			this.optionViews.remove( optionViewModel );

			if ( this.model.get( 'options' ).length == 0 ) {
				$( '.options ul', this.$el ).html( '' );
			}

			var data = {
				id: this.model.get( 'id' ),
				callback: 'onRadioItemDeleteCallback',
				options: {
					itemID: optionModel.id,
				}
			};

			happyForms.previewSend( 'happyforms-part-dom-update', data );
		},

		onOptionModelsSorted: function() {
			this.optionViews.reset( _.map( this.model.get( 'options' ).pluck( 'id' ), function( id ) {
				return this.optionViews.get( id );
			}, this ) );
			this.model.trigger( 'change' );

			var model = this.model;

			this.model.fetchHtml( function( response ) {
				var data = {
					id: model.get( 'id' ),
					html: response,
				};

				happyForms.previewSend( 'happyforms-form-part-refresh', data );
			} );
		},

		addOptionView: function( optionModel, options ) {
			var optionView = new happyForms.classes.views.parts.radioOption( _.extend( {
				model: optionModel,
				part: this.model,
			}, options ) );

			var optionViewModel = new Backbone.Model( {
				id: optionModel.id,
				view: optionView,
			} );

			this.optionViews.add( optionViewModel, options );
		},

		onOptionViewAdd: function( viewModel, collection, options ) {
			var optionView = viewModel.get( 'view' );
			$( '.option-list', this.$el ).append( optionView.render().$el );
			optionView.trigger( 'ready' );
		},

		onOptionViewRemove: function( viewModel ) {
			var optionView = viewModel.get( 'view' );
			optionView.remove();
		},

		onOptionSortStop: function( e, ui ) {
			var $sortable = $( '.option-list', this.$el );
			var ids = $sortable.sortable( 'toArray', { attribute: 'data-option-id' } );

			this.model.get( 'options' ).reset( _.map( ids, function( id ) {
				return this.model.get( 'options' ).get( id );
			}, this ) );
		},

		onOptionViewsSorted: function( optionViews ) {
			var $stage = $( '.option-list', this.$el );

			optionViews.forEach( function( optionViewModel ) {
				var optionView = optionViewModel.get( 'view' );
				var $optionViewEl = optionView.$el;
				$optionViewEl.detach();
				$stage.append( $optionViewEl );
				optionView.trigger( 'refresh' );
			}, this );
		},

		getOptionModelID: function() {
			var prefix = this.model.get( 'id' ) + '_option_';
			var collection = this.model.get( 'options' );
			var timestamp = new Date().getTime();
			var id = prefix + timestamp;

			return id;
		},

		onAddOptionClick: function( e ) {
			e.preventDefault();

			var itemID = this.getOptionModelID();
			var itemModel = new OptionModel( { id: itemID } );
			this.model.get( 'options' ).add( itemModel );
		},

		onDisplayTypeChange: function(e) {
			var $input = $( e.target );
			var attribute = $input.data( 'bind' );
			var value = $input.val();

			this.model.set( attribute, value );

			$( '.part-options-width-setting select option', this.$el ).hide();

			var $supportedOptions = $( '.part-options-width-setting select option.display-type--' + value, this.$el );
			$supportedOptions.show();

			$( '.part-options-width-setting select' ).val( 'auto' ).trigger( 'change' );

			var data = {
				id: this.model.get( 'id' ),
				callback: 'onRadioDisplayTypeChangeCallback',
			};

			happyForms.previewSend( 'happyforms-part-dom-update', data );
		},

		onEnterKey: function( e ) {
			e.preventDefault();

			if ( 'Enter' === e.key ) {
				$( '.add-option', this.$el ).trigger( 'click' );
				return;
			}
		},

		onImportOptionsClick: function( e ) {
			e.preventDefault();

			$( '.options', this.$el ).hide();
			$( '.options-import', this.$el ).show();
			$( '.links.mode-manual', this.$el ).hide();
			$( '.links.mode-import', this.$el ).show();
			$( '.option-import-area', this.$el ).trigger( 'focus' );
		},

		onAddOptionsClick: function( e ) {
			e.preventDefault();

			$( '.options', this.$el ).show();
			$( '.options-import', this.$el ).hide();
			$( '.links.mode-import', this.$el ).hide();
			$( '.links.mode-manual', this.$el ).show();
			$( '.option-import-area', this.$el ).val( '' );
		},

		onImportOptionClick: function( e ) {
			e.preventDefault();

			var $textarea = $( '.option-import-area', this.$el );
			var list = $textarea.val();
			var self = this;

			var models = list
				.split( /[\r\n]+/g )
				.map( function( s ) {
					return s.trim();
				} )
				.filter( function( s ) {
					return s;
				} )
				.forEach( function( label, i, list ) {
					_.delay( function() {
						var itemID = self.getOptionModelID();
						var item = new OptionModel( {
							id: itemID,
							label: label
						} );

						self.model.get( 'options' ).add( item, { refresh: ( list.length - 1 === i ) } );
					}, i );
				} );

			$textarea.val( '' );
			$( '.add-options', this.$el ).trigger( 'click' );
		},

		onAddOtherOption: function( model, value ) {
			var $otherOptionOptions = $( '.happyforms-nested-settings[data-trigger="other_option"]', this.$el );

			if ( 1 == value ) {
				$otherOptionOptions.show();
			} else {
				$otherOptionOptions.hide();
			}

			this.refreshPart();
		},

		onOtherOptionLabelChange: function() {
			var data = {
				id: this.model.get( 'id' ),
				callback: 'onRadioOtherOptionLabelChangeCallback'
			};

			happyForms.previewSend( 'happyforms-part-dom-update', data );
		},

		onOtherOptionPlaceholderChange: function() {
			var data = {
				id: this.model.get( 'id' ),
				callback: 'onRadioOtherOptionPlaceholderChangeCallback'
			};

			happyForms.previewSend( 'happyforms-part-dom-update', data );
		},

	} );

	happyForms.previewer = _.extend( happyForms.previewer, {
		onRadioItemDeleteCallback: function( id, html, options ) {
			var part = this.getPartModel( id );
			var $part = this.getPartElement( html );
			var $option = $( '#' + options.itemID, $part );

			$option.remove();
		},

		onRadioDisplayTypeChangeCallback: function( id, html, options ) {
			var part = this.getPartModel( id );
			var $part = this.getPartElement( html );

			if ( 'block' === part.get( 'display_type' ) ) {
				$part.addClass( 'display-type--block' );
			} else {
				$part.removeClass( 'display-type--block' );
			}
		},

		onRadioItemLabelChangeCallback: function( id, html, options ) {
			var part = this.getPartModel( id );
			var $part = this.getPartElement( html );
			var option = part.get( 'options' ).get( options.itemID );
			var $option = $( '#' + options.itemID, $part );

			this.$( 'span.label', $option ).text( option.get( 'label' ) );
		},

		onRadioItemDescriptionChangeCallback: function( id, html, options ) {
			var part = this.getPartModel( id );
			var $part = this.getPartElement( html );
			var option = part.get( 'options' ).get( options.itemID );
			var $option = $( '#' + options.itemID, $part );

			this.$( '.happyforms-part-option__description', $option ).text( option.get( 'description' ) );
		},

		onRadioItemDefaultChangeCallback: function( id, html, options ) {
			var part = this.getPartModel( id );
			var $part = this.getPartElement( html );
			var option = part.get( 'options' ).get( options.itemID );
			var $option = $( '#' + options.itemID, $part );

			this.$( 'input', $option ).prop( 'checked', option.get( 'is_default' ) );
		},

		onRadioOtherOptionLabelChangeCallback: function( id, html, options ) {
			var part = this.getPartModel( id );
			var $part = this.getPartElement( html );
			var $otherOptionLabel = $( '.happyforms-part-option--other .label', $part );

			$otherOptionLabel.text( part.get( 'other_option_label' ) );
		},

		onRadioOtherOptionPlaceholderChangeCallback: function( id, html, options ) {
			var part = this.getPartModel( id );
			var $part = this.getPartElement( html );
			var $otherOptionInput = $( '.happyforms-part-option--other input[type=text]', $part );

			$otherOptionInput.attr( 'placeholder', part.get( 'other_option_placeholder' ) );
		}
	} );

} ) ( jQuery, _, Backbone, wp.customize, _happyFormsSettings );
