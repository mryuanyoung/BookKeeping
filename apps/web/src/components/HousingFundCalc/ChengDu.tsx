import { useState } from "react";
import { NumberPicker, FormItem, Space, DatePicker } from '@formily/antd'
import { FormProvider, FormConsumer, Field, ArrayField, ObjectField } from '@formily/react';
import { Button } from 'antd';
import { Form } from '@formily/core';
import moment from "moment";


const UpperLimit = [[40, 40], [80, 70]];

interface Props {
	form: Form
}

const ChengDu: React.FC<Props> = ({ form }) => {
	const [single, setSingle] = useState(0);
	const [first, setFirst] = useState(0);
	const [editDetail, setEditDetail] = useState(false);

	const limitation = UpperLimit[single][first];

	function editFundDetail() {
		form.fields.fundPerMonth.editable = false;
		form.fields.startDate.editable = false;
		form.fields.endDate.editable = false;
		setEditDetail(true)
	}

	function exitFundDetail() {
		form.setValuesIn('depositDetail', undefined);
		form.setValuesIn('withdrawDetail', undefined);
		form.fields.fundPerMonth.editable = true;
		form.fields.startDate.editable = true;
		form.fields.endDate.editable = true;
		setEditDetail(false);
	}

	function calculate() {
		const depositDetail = form.values.depositDetail;
		const withdrawDetail = form.values.withdrawDetail;
		if (depositDetail === undefined || depositDetail.length === 0 || withdrawDetail === undefined || withdrawDetail.length === 0) {
			simpleCalc();
		}
		else {
			detailCalc();
		}
	}

	function simpleCalc() {
		form.setValuesIn('res', '');
		const startDate = moment(form.values.startDate);
		const endDate = moment(form.values.endDate);
		const diff = endDate.diff(startDate, 'months') + 1;

		const rate = form.values.rate;
		const fund = form.values.fundPerMonth;
		const res = rate * fund * (1 + diff) * diff / 2;
		form.setValuesIn('res', `理论上限: ${(res / 10000).toFixed(1)} w\n最高上限: ${Math.min(limitation, res)} w`);
	}

	function detailCalc() {
		form.setValuesIn('res', '');

		const rate = form.values.rate;
		const depositDetail = form.values.depositDetail;
		const withdrawDetail = form.values.withdrawDetail;

		let total = 0, toSub = 0, month = 1;
		for (let i = depositDetail.length - 1; i >= 0; i--, month++) {
			let currency = depositDetail[i];
			toSub += withdrawDetail[i];

			if (toSub > currency) {
				toSub -= currency;
				continue;
			}

			currency -= toSub;
			toSub = 0;
			total += rate * currency * month;
		}

		if (toSub !== 0) {
			form.setValuesIn('res', '计算错误');
		}
		else {
			form.setValuesIn('res', `理论上限: ${(total / 10000).toFixed(1)} w\n最高上限: ${Math.min(limitation, total)} w`);
		}
	}

	return (
		<div >
			<FormProvider form={form}>
				<Field
					name="rate"
					title="存贷系数"
					initialValue={0.9}
					decorator={[FormItem]}
					component={[
						NumberPicker,
					]}
				/>
				<Field
					name="fundPerMonth"
					title="每月缴存"
					decorator={[FormItem]}
					component={[
						NumberPicker,
					]}
				/>
				<Field
					name="startDate"
					title="起始月份"
					decorator={[FormItem]}
					component={[
						DatePicker,
						{
							picker: 'month',
							format: 'YYYY/MM',
						}
					]}
				/>
				<Field
					name="endDate"
					title="结束月份"
					editable={!editDetail}
					decorator={[FormItem]}
					component={[
						DatePicker,
						{
							picker: 'month',
							format: 'YYYY/MM',
						}
					]}
				/>
				<FormConsumer>
					{(form) => {
						if (!editDetail || !form.values.fundPerMonth || !form.values.startDate || !form.values.endDate) {
							return <></>;
						}

						const startDate = moment(form.values.startDate);
						const endDate = moment(form.values.endDate);
						const diff = endDate.diff(startDate, 'months') + 1;
						if (diff <= 0) {
							return <></>;
						}

						const deposit = Array(diff).fill(0).map(_ => form.values.fundPerMonth);
						const withdraw = Array(diff).fill(0);

						form.setValuesIn('depositDetail', deposit);
						form.setValuesIn('withdrawDetail', withdraw);

						return (
							<div style={{ display: 'flex', gap: '10vw' }}>
								<ArrayField title='每月存取详情' name="depositDetail">
									{(field) => {
										return (
											<div>
												存
												{field.value?.map((item, index) => (
													<div
														key={index}
														style={{ display: 'flex', marginBottom: 10, alignItems: 'center', gap: '10px' }}
													>
														<div>{`${moment(startDate).add(index, 'months').year()}/${moment(startDate).add(index, 'months').month() + 1}`}: </div>
														<Field name={index} component={[NumberPicker]} />
													</div>
												))}
											</div>
										)
									}}
								</ArrayField>
								<ArrayField name="withdrawDetail" title='每月存取详情'>
									{(field) => {
										return (
											<div>
												取
												{field.value?.map((item, index) => (
													<div
														key={index}
														style={{ display: 'flex-block', marginBottom: 10 }}
													>
														<Field name={index} component={[NumberPicker]} />
													</div>
												))}
											</div>
										)
									}}
								</ArrayField>
							</div>
						)
					}}
				</FormConsumer>
				{/* <FormConsumer>
					{(form) => {

						return (
							<FormItem>
								{JSON.stringify(form.values)}
							</FormItem>
						)
					}}
				</FormConsumer> */}
				<div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
					{
						editDetail ? <Button onClick={exitFundDetail}>返回</Button> : <Button onClick={editFundDetail}>编辑详情</Button>
					}
					<Button onClick={calculate}>计算</Button>
				</div>
				<Field name='res' initialValue='' component={[({ value }) => (
					<pre>{value}</pre>
				)]}>
				</Field>
			</FormProvider>
		</div>
	)
}

export default ChengDu;