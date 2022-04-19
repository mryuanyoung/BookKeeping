import React, { Dispatch, SetStateAction, useCallback, useContext, useState } from 'react';
import { Modal, Form, Input, Button, Space, Select, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

import { insertField } from '../../api/institution';
import { FieldWithType } from '../../interface/university';
import { InfoList } from '../../constant/institution';
import style from './index.module.scss';
import { Ctx } from '../../pages/InstitutionDetail';

const { Option } = Select;

interface Props {
	visible: boolean
	setVisible: Dispatch<SetStateAction<boolean>>,
}


const InstitutionDetailModal: React.FC<Props> = (props) => {

	const {id, setFresh} = useContext(Ctx);
	const { visible, setVisible } = props;
	const [loading, setLoading] = useState(false);

	const handleCancel = useCallback(() => {
		setVisible(false);
		setLoading(false);
	}, []);

	const onFinish = async (value: { fields: Array<FieldWithType> }) => {
		if (!value.fields || value.fields.length === 0 || !id) return;
		setLoading(true);
		const {success, message: msg, content} = await insertField({
			fields: value.fields,
			id
		});
    setLoading(false);
    if(success){
      message.success(msg || content, 2);
      setFresh();
      handleCancel();
    }
    else{
      message.error(msg || content, 2);
    }
	};

	return (
		<Modal
			footer={null}
			title='新增字段'
			visible={visible}
			onCancel={handleCancel}
			width='60vw'
			destroyOnClose
		>
			<Form
				onFinish={onFinish}
				scrollToFirstError
			>
				<Form.List name="fields">
					{(fields, { add, remove }) => (
						<>
							{fields.map(field => (
								<Space key={field.key} align="baseline">
									<Form.Item
										noStyle
									>
										<Form.Item
											{...field}
											label="类型"
											name={[field.name, 'type']}
											fieldKey={[field.fieldKey, 'type']}
											rules={[{ required: true, message: '请选择类型' }]}
										>
											<Select style={{ width: 100 }}>
												{InfoList.map(item => (
													<Option key={item[0]} value={item[0]}>
														{item[1]}
													</Option>
												))}
											</Select>
										</Form.Item>
									</Form.Item>
									<Form.Item
										{...field}
										label="字段名(en)"
										name={[field.name, 'field']}
										fieldKey={[field.fieldKey, 'field']}
										rules={[{ required: true, message: '请输入字段英文名' }]}
									>
										<Input style={{ width: '5vw' }} />
									</Form.Item>

									<Form.Item
										{...field}
										label="字段名(cn)"
										name={[field.name, 'name']}
										fieldKey={[field.fieldKey, 'name']}
										rules={[{ required: true, message: '请输入字段中文名' }]}
									>
										<Input style={{ width: '5vw' }} />
									</Form.Item>

									<Form.Item
										{...field}
										label="字段值"
										name={[field.name, 'value']}
										fieldKey={[field.fieldKey, 'value']}
										rules={[{ required: true, message: '请输入字段值' }]}
									>
										<Input />
									</Form.Item>

									<MinusCircleOutlined onClick={() => remove(field.name)} />
								</Space>
							))}

							<Form.Item>
								<Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
									添加字段
              </Button>
							</Form.Item>
						</>
					)}
				</Form.List>
				<Form.Item>
					<Button loading={loading} type="primary" htmlType="submit" id={style.submit}>
						提 交
                    </Button>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default InstitutionDetailModal;