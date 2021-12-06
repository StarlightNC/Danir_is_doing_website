import { SlotFillProvider, Button, Modal, Guide, Popover, Notice, ExternalLink, TextControl, CheckboxControl, BaseControl } from '@wordpress/components';
import { useState, useReducer, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 *
 * Modal handler class
 *
 */
export default function( $, settings ) {

	const { render } = wp.element;

	/**
	 *
	 * Deactivation modal
	 *
	 */
	const DeactivateModal = ( props ) => {
		const [ option, setOption ] = useState( 'yes' );

		const onChange = ( e ) => {
			setOption( e.target.value );
		};

		const onSubmit = () => {
			$.post( ajaxurl, {
				action: settings.deactivateModalAction,
				_wpnonce: settings.deactivateModalNonce,
				keep_data: option, 
			}, function() {
				window.location.href = props.redirectURL;
			} );
			
			return props.onRequestClose();
		}

		return (
			<Modal className="happyforms-modal happyforms-modal--deactivate" title="What about your data?" onRequestClose={ props.onRequestClose }>
				<div className="happyforms-modal__body" onChange={ onChange }>
					<label htmlFor="happyforms-keep-data-yes">
						<input 
							type="radio"
							id="happyforms-keep-data-yes"
							name="happyforms-keep-data" 
							value="yes"
							defaultChecked
						/>
						<span>{ __( 'Keep plugin data (recommended)', 'happyforms' ) }</span>
					</label>
					<label htmlFor="happyforms-keep-data-no">
						<input
							type="radio"
							id="happyforms-keep-data-no"
							name="happyforms-keep-data"
							value="no"
						/>
						<span>{ __( 'Permanently delete plugin data', 'happyforms' ) }</span>
					</label>
				</div>
				<div className="happyforms-modal__footer">
					<div className="happyforms-modal__footer-button-group">
						<Button 
							isPrimary={true} 
							onClick={ onSubmit } 
							text={ option == 'yes' ? 
								__( 'Deactivate Plugin', 'happyforms' ) : 
								__( 'Delete Data and Deactivate Plugin', 'happyforms' ) }>
						</Button>
					</div>
				</div>
			</Modal>
		);
	};

	/**
	 *
	 * Modal wrapper
	 *
	 */
	const ModalProvider = ( props ) => {
		return (
			<SlotFillProvider>
				{ props.modal }
				<Popover.Slot />
			</SlotFillProvider>
		);
	};
	
	return class DashboardModals {

		area = null;
		
		constructor() {
			this.area = document.getElementById( 'happyforms-modals-area' );
		}

		openDeactivateModal( redirectURL ) {
			var modal = <DeactivateModal onRequestClose={ this.closeModal.bind( this, 'deactivate' ) } redirectURL={ redirectURL } />

			this.openModal( modal );
		}

		openModal( modal ) {
			render( <ModalProvider modal={modal}></ModalProvider>, this.area );
		}

		closeModal( modal ) {
			render( <></>, this.area );

			$.post( ajaxurl, {
				action: settings.actionModalDismiss,
				id: modal, 
			} );
		}

	};

}