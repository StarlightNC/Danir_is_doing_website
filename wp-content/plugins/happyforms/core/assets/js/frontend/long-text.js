( function( $, editorSettings ) {

	HappyForms.parts = HappyForms.parts || {};

	window._wpLink = {};

	var defaultOnPostRender = function( editor, settings, e ) {
		e.target.$el.html( $( '#' + settings.icon ).html() );
	};

	var GetButton = function( editor, settings ) {
		var onPostRender = settings.onPostRender || defaultOnPostRender;

		var button = Object.assign( {}, settings, {
			onClick: settings.onClick.bind( this, editor ),
			onPostRender: onPostRender.bind( this, editor, settings ),
		} );

		return button;
	};

	var buttons = {
		hfbold: {
			icon: 'happyforms-rich-text-icon-bold',
			stateSelector: 'strong',

			onClick: function ( editor ) {
				editor.execCommand( 'mceToggleFormat', false, 'bold' );
			},
		},
		hfitalic: {
			icon: 'happyforms-rich-text-icon-italic',
			stateSelector: 'em',

			onClick: function ( editor ) {
				editor.execCommand( 'mceToggleFormat', false, 'italic' );
			},
		},
		hful: {
			icon: 'happyforms-rich-text-icon-ul',
			stateSelector: 'ul',

			onClick: function ( editor ) {
				editor.execCommand( 'InsertUnorderedList' );
			},
		},
		hfol: {
			icon: 'happyforms-rich-text-icon-ol',
			stateSelector: 'ol',

			onClick: function ( editor ) {
				editor.execCommand( 'InsertOrderedList' );
			},
		},
		hfquote: {
			icon: 'happyforms-rich-text-icon-quote',
			stateSelector: 'blockquote',

			onClick: function ( editor ) {
				editor.execCommand( 'mceToggleFormat', false, 'blockquote' );
			},
		},
		hfcode: {
			icon: 'happyforms-rich-text-icon-code',
			stateSelector: 'pre',

			onClick: function ( editor ) {
				editor.execCommand( 'mceToggleFormat', false, 'pre' );
			},
		},
		hfstrike: {
			icon: 'happyforms-rich-text-icon-strike',
			stateSelector: 'del',

			onClick: function ( editor ) {
				editor.execCommand( 'mceToggleFormat', false, 'strikethrough' );
			},
		},
		hfunderline: {
			icon: 'happyforms-rich-text-icon-underline',

			onClick: function ( editor ) {
				editor.execCommand( 'mceToggleFormat', false, 'underline' );
			},

			onPostRender: function( editor, settings, e ) {
				defaultOnPostRender.apply( this, arguments );

				var self = e.target;

				editor.on( 'NodeChange', function( e ) {
					self.active( 'underline' === e.element.style.textDecoration );
				} );
			},
		},
		hfhr: {
			icon: 'happyforms-rich-text-icon-hr',

			onClick: function ( editor ) {
				editor.execCommand( 'InsertHorizontalRule' );
			},
		},
	};

	HappyForms.parts.multi_line_text = {
		init: function( options ) {
			this.$form = options.form;
			this.rich = this.$el.hasClass( 'happyforms-part--rich_text' );
			this.type = this.$el.data( 'happyforms-type' );
			this.$input = $( 'textarea', this.$el );
			this.$counter = $( '.happyforms-part__char-counter span.counter', this.$el );

			if ( ! this.rich ) {
				this.$input.on( 'blur', this.onBlur.bind( this ) );
				this.$input.on( 'keyup', this.triggerChange.bind( this ) );
				this.$input.on( 'change', this.triggerChange.bind( this ) );
				this.$el.on( 'keyup', this.refreshCounter.bind( this ) );
				this.refreshCounter();
				$( '.happyforms-part__char-counter' ).show();
			} else {
				this.editorId = this.$input.attr( 'id' );
				this.editor = null;

				this.$el.on( 'happyforms.attach', this.editorCreate.bind( this ) );
				this.$el.on( 'happyforms.detach', this.editorDestroy.bind( this ) );
				this.$el.on( 'happyforms.formclass', this.onFormClassChange.bind( this ) );
				this.$el.on( 'happyforms.cssvar', this.onCSSVarChange.bind( this ) );

				this.editorCreate();
			}
			this.initTooltip();
		},

		getValueLength: function() {
			var mode = this.$input.attr( 'data-length-mode' );
			var value = this.$input.val();

			if ( this.rich ) {
				value = this.editor.getContent( { format: 'text' } );
				value = value.replace( /[\r\n]+/gm, ' ' );
				value = value.replace(/\s+/g,' ');
				value = value.trim();
			}

			var length = value.length;

			if ( 'word' === mode ) {
				var matches = value.match( /\w+/g );
				length = matches ? matches.length : 0;
			} else {
				if ( this.rich && '\n' === value ) {
					length --;
				}
			}

			return length;
		},

		refreshCounter: function() {
			var hasLength = parseInt( this.$input.attr( 'data-length' ), 10 );

			if ( hasLength < 1 ) {
				return;
			}

			var length = this.getValueLength();
			this.$counter.text( length );
		},

		editorCreate: function() {
			var self = this;

			tinymce.init( {
				selector: '#' + this.editorId,
				branding: false,
				menubar: false,
				toolbar1: 'hfbold,hfitalic,hful,hfol,hfquote,link,unlink,hfcode,hfstrike,hfunderline,hfhr',
				statusbar: true,
				resize: true,
				plugins: 'hr,paste',
				content_css: editorSettings.contentCSS,
				valid_elements: editorSettings.validElements,
				paste_as_text: true,
				inline_styles: false,
				min_height: 50,
				formats: {
					underline: { inline: 'u', exact : true },
					strikethrough: { inline: 'del', exact : true },
				},

				setup: function( editor ) {
					var wpAddButton = editor.addButton;

					// Remove tooltips
					editor.addButton = function( id, options ) {
						switch ( id ) {
							case 'link':
							case 'unlink':
							case 'wp_link_apply':
							case 'wp_link_edit':
							case 'wp_link_remove':
								delete options.tooltip;
								break;
							default:
								break;
						}

						return wpAddButton.apply( this, arguments );
					}

					// Add custom buttons
					for ( var button in buttons ) {
						editor.addButton( button, GetButton( editor, buttons[button] ) );
					}

					// Inherit form class, fonts and css-vars
					editor.on( 'init', function() {
						self.editor = editor;

						self.inheritFormClass();
						self.inheritFonts();

						var target = self.editor.dom.doc.querySelector( 'body' );
						self.inheritCSSVars( editorSettings.cssVars, target );
						self.refreshCounter();
						$( '.happyforms-part__char-counter' ).show();
					} );

					// Custom main toolbar icons
					editor.on( 'postrender', function() {
						var $el = $( editor.container );

						$( 'i.mce-i-link', $el ).replaceWith(
							$( '#happyforms-rich-text-icon-link' ).html()
						);

						$( 'i.mce-i-unlink', $el ).replaceWith(
							$( '#happyforms-rich-text-icon-unlink' ).html()
						);

						self.editor = editor;

						var target = self.editor.dom.doc.querySelector( 'body' );
						target.style.color = $( 'body' ).css( 'color' );
					} );

					editor.on( 'change', self.onEditorChange.bind( self ) );
					editor.on( 'focus', self.onFocus.bind( self ) );
					editor.on( 'blur', self.onBlur.bind( self ) );
					editor.on( 'keyup', self.refreshCounter.bind( self ) );
				},
			} );
		},

		editorDestroy: function() {
			var editor = tinymce.get( this.editorId );

			if ( editor ) {
				editor.remove();
			}

			self.editor = null;
		},

		onEditorChange: function() {
			this.triggerChange();
		},

		onFocus: function() {
			this.$el.addClass( 'focus' );
		},

		onBlur: function() {
			this.$el.removeClass( 'focus' );
		},

		inheritFormClass: function() {
			this.editor.dom.doc.documentElement.className = this.$form.attr( 'class' );
		},

		inheritCSSVars: function( vars, target ) {
			var styles = getComputedStyle( this.$form[0] );

			if ( 'object' !== typeof vars ) {
				return;
			}

			vars.forEach( function( variable ) {
				var value = styles.getPropertyValue( variable );
				target.style.setProperty( variable, value );
			} );
		},

		inheritFonts: function() {
			var formStyle = getComputedStyle( this.$form[0] );
			var stylesheets = [].slice.call( document.styleSheets );
			var editorDocument = this.editor.dom.doc;

			// Append parent stylesheets to editor
			stylesheets
				.map( function( stylesheet ) {
					if ( ! stylesheet.ownerNode ) {
						return null;
					}

					return stylesheet.ownerNode.cloneNode();
				} )
				.forEach( function( node ) {
					if ( node ) {
						editorDocument.head.insertBefore( node, editorDocument.head.firstChild );
					}
				} );

			// Apply font-family
			editorDocument.body.style.setProperty( 'font-family', formStyle.getPropertyValue( 'font-family' ) );
		},

		onFormClassChange: function( e, classes ) {
			if ( this.editor ) {
				this.editor.dom.doc.documentElement.className = classes;
			}
		},

		onCSSVarChange: function( e, variable ) {
			if ( this.editor ) {
				this.editor.dom.doc.querySelector( 'body' ).style.setProperty( variable.name, variable.value );

				$( '.happyforms-editor-toolbar-link' ).each( function() {
					this.style.setProperty( variable.name, variable.value );
				} );
			}
		},

		isFilled: function() {
			if ( this.rich ) {
				var content = tinymce.get( this.editorId ).getContent();
				return '' !== content;
			}

			return '' !== this.$input.val();
		},

		serialize: function() {
			var serialized = HappyForms.parts.base.serialize.apply( this, arguments );

			if ( this.rich ) {
				serialized = [ {
					name: this.$input.attr( 'name' ),
					value: tinymce.get( this.editorId ).getContent(),
				} ];
			}

			return serialized;
		}
	};

} )( jQuery, _happyFormsRichTextSettings );
