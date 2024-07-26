declare let dev: boolean;

const x: string = "Ahoy, witam na mikroczacie. Inicjalizowanie procesu otwierania czatu... bzzzzzzzyt.... ";
const defaultAction: string = "";

const currentActionElement = document.getElementById("currentAction");

let handler = {
	set: function (obj, prop, value)
	{
		if (value === "" || value === null || value === false)
		{
			value = obj.defaultAction;
		}

		obj[prop] = value;
		currentActionElement.innerHTML = value;

		return true;
	}
};


export let action = new Proxy({ x, defaultAction }, handler);
