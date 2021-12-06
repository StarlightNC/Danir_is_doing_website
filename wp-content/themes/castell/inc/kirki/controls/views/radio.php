<div class="kirki-input-container" data-id="' + data.id + '">
	
		<span class="customize-control-title">{{{ data.label }}}</span>
	
	
		<span class="description customize-control-description">{{{ data.description }}}</span>
	
	
		<label>
			<input data.inputattrs type="radio" data-id="{{ data['data-id'] }}" value="{{ key }}" name="_customize-radio-{{ data['data-id'] }}" if data.value="==" key> checked
			/>
			
				{{{ val[0] }}}<span class="option-description">{{{ val[1] }}}</span>
			
				{{ val }}
			
		</label>
	
</div>