<div class="kirki-input-container" data-id="{{ data.id }}">
	
		<label for="{{ elementIdPrefix }}_editor" class="customize-control-title">
			{{{ data.label }}}
		</label>
	
	
		<span class="description customize-control-description">{{{ data.description }}}</span>
	
	<div class="customize-control-notifications-container"></div>
	<textarea id="{{ elementIdPrefix }}_editor" _.each _.extend data.input_attrs function value key>
			{{{ key }}}="{{ value }}"
		
		></textarea>
</div>