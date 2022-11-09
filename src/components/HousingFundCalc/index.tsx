import { Button } from "@material-ui/core"
import { useState } from "react";
import { Drawer } from 'antd';
import ChengDu from "./ChengDu"
import { createForm } from '@formily/core'

enum City {
	ChengDu
}

const ComponentMap = {
	[City.ChengDu]: ChengDu
}

const defaultCity = City.ChengDu;
const form = createForm();


export default () => {

	const [city, setCity] = useState(defaultCity);
	const [visible, setVisible] = useState(false);
	const Component = ComponentMap[city];

	function handleClose(){
		setVisible(false);
		form.reset();
	}

	return (
		<div>
			<Button variant="outlined" onClick={() => setVisible(true)}>公积金计算</Button>
			<Drawer closable={false} destroyOnClose placement='top' open={visible} onClose={handleClose}>
				<Component form={form} />
			</Drawer>
		</div>
	)
}