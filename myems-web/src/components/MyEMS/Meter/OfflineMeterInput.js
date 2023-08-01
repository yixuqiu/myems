import React, { Fragment, useEffect, useState } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Col,
  Form,
  FormGroup,
  Input,
  Label,
  Row,
  CustomInput,
} from 'reactstrap';
import moment from "moment";
import {getCookieValue, createCookie, checkEmpty} from '../../../helpers/utils';
import withRedirect from '../../../hoc/withRedirect';
import { withTranslation } from 'react-i18next';
import BootstrapTable from 'react-bootstrap-table-next';
import { toast } from 'react-toastify';
import { APIBaseURL } from '../../../config';
import { DateRangePicker } from 'rsuite';
import { endOfDay,endOfMonth ,startOfMonth} from 'date-fns';
import FalconCardHeader from '../../common/FalconCardHeader';
import cellEditFactory from "react-bootstrap-table2-editor";

const OfflineMeterInput = ({ setRedirect, setRedirectUrl, t }) => {
  let current_moment = moment();
  useEffect(() => {
    let is_logged_in = getCookieValue('is_logged_in');
    let user_name = getCookieValue('user_name');
    let user_display_name = getCookieValue('user_display_name');
    let user_uuid = getCookieValue('user_uuid');
    let token = getCookieValue('token');
    if (checkEmpty(is_logged_in) || checkEmpty(token)|| checkEmpty(user_uuid) || !is_logged_in) {
      setRedirectUrl(`/authentication/basic/login`);
      setRedirect(true);
    } else {
      //update expires time of cookies
      createCookie('is_logged_in', true, 1000 * 60 * 60 * 8);
      createCookie('user_name', user_name, 1000 * 60 * 60 * 8);
      createCookie('user_display_name', user_display_name, 1000 * 60 * 60 * 8);
      createCookie('user_uuid', user_uuid, 1000 * 60 * 60 * 8);
      createCookie('token', token, 1000 * 60 * 60 * 8);
    }
  });
  const [meterList, setMeterList] = useState([]);
  const [OfflinemeterName, setOfflinemeterName] = useState([{ value: 0, label: "" }]);
  const [Offlinemeter, setOfflinemeter] = useState('');

  //Query From
  const [reportingPeriodDateRange, setReportingPeriodDateRange] = useState([current_moment.clone().startOf('month').toDate(), current_moment.clone().endOf('month').toDate()]);

  const dateRangePickerStyle = { display: 'block', zIndex: 10 };

  // buttons
  const [submitButtonDisabled, setSubmitButtonDisabled] = useState(true);
  const [spinnerHidden, setSpinnerHidden] = useState(false);
  const [exportButtonHidden, setExportButtonHidden] = useState(true);

  useEffect(() => {
    getmeterslist()
  }, []);

  const getmeterslist = async () => {
    let isResponseOK = false;
    await fetch(APIBaseURL + '/offlinemeters', {
      method: 'GET',
      headers: {
        "Content-type": "application/json",
        "User-UUID": getCookieValue('user_uuid'),
        "Token": getCookieValue('token')
      },
      body: null,
    }).then(response => {
      if (response.ok) {
        isResponseOK = true;
      }
      return response.json();
    }).then(json => {
      if (isResponseOK) {
        var typeDatadic = []
        let tempmeterid=''
        json.forEach((currentValue, index) => {
          var type = {}
          type.value = currentValue.id
          type.label = currentValue.name
          typeDatadic.push(type)
        });

        if (typeDatadic.length >= 1) {
          tempmeterid = typeDatadic[0].value
          setOfflinemeter(tempmeterid)
        }
        setOfflinemeterName(typeDatadic)
        setSubmitButtonDisabled(false);
        setSpinnerHidden(true);
      } else {
        toast.error(json.description);
      }
    }).catch(err => {
      console.log(err);
    });
  }


  const getmeterslistdata = async () => {
    let isResponseOK = false;
    await fetch(APIBaseURL + '/reports/metermonthgenerate?' +
      'meterid=' + Offlinemeter +
      '&reportingperiodstartdatetime=' + moment(reportingPeriodDateRange[0]).format('YYYY-MM-DDTHH:mm:ss') +
      '&reportingperiodenddatetime=' + moment(reportingPeriodDateRange[1]).format('YYYY-MM-DDTHH:mm:ss'), {
      method: 'GET',
      headers: {
        "Content-type": "application/json",
        "User-UUID": getCookieValue('user_uuid'),
        "Token": getCookieValue('token')
      },
      body: null,

    }).then(response => {
      if (response.ok) {
        isResponseOK = true;
      }
      return response.json();
    }).then(json => {
      if (isResponseOK) {
        let meters = [];
        json['re_values'].forEach((currentValue, index) => {
          meters.push({
            'monthdate': currentValue['monthdate'],
            'dayva': currentValue['dayva']
          });
        });
        setMeterList(meters);

        // enable submit button
        setSubmitButtonDisabled(false);
        // hide spinner
        setSpinnerHidden(true);
        // show export button
        setExportButtonHidden(false);
      } else {
        toast.error(json.description)
      }
    }).catch(err => {
      console.log(err);
    });

  }

  const dateRangePickerLocale = {
    sunday: t('sunday'),
    monday: t('monday'),
    tuesday: t('tuesday'),
    wednesday: t('wednesday'),
    thursday: t('thursday'),
    friday: t('friday'),
    saturday: t('saturday'),
    ok: t('ok'),
    today: t('today'),
    yesterday: t('yesterday'),
    hours: t('hours'),
    minutes: t('minutes'),
    seconds: t('seconds'),
    last7Days: t('last7Days')
  };
  const columns = [
    {
      dataField: 'monthdate',
      headerClasses: 'border-0',
      text: t('Date'),
      classes: 'border-0 py-2 align-middle',
      sort: true,
      editable: false,
    },
    {
      dataField: 'dayva',
      headerClasses: 'border-0',
      text: t('Daily Value'),
      classes: 'border-0 py-2 align-middle',
      sort: true,
      editable: true,
      formatter: (cell, row, rowIndex) => {
        if (cell == null) {
          return (<Input type="text" disabled={false} style={{ width: '20%' }}></Input>);
        }
        else {
          return (<Input type="text" disabled={true} defaultValue={cell} style={{ width: '20%' }}></Input>);
        }
      },
    },
  ];
  const defaultSorted = [{
    dataField: 'startdatetime',
    order: 'asc'
  }];

  const labelClasses = 'ls text-uppercase text-600 font-weight-semi-bold mb-0';

  let onReportingPeriodChange = (DateRange) => {
    if (DateRange == null) {
      setReportingPeriodDateRange([null, null]);
    } else {
      if (moment(DateRange[1]).format('HH:mm:ss') == '00:00:00') {
        // if the user did not change time value, set the default time to the end of day
        DateRange[1] = endOfDay(DateRange[1]);
      }
      if (Number(moment(DateRange[0]).format('MM')) !=Number(current_moment.format('MM')))
      {
        DateRange[0] = startOfMonth(DateRange[0]);
        DateRange[1] = endOfMonth(DateRange[1]);
      }
      if (Number(moment(DateRange[0]).format('MM')) !=Number(moment(DateRange[1]).format('MM')))
      {
        DateRange[0] = startOfMonth(DateRange[0]);
        DateRange[1] = endOfMonth(DateRange[0]);
      }
      if (Number(moment(DateRange[0]).format('MM')) ==Number(current_moment.format('MM')))
      {
        DateRange[0] = startOfMonth(DateRange[0]);
        DateRange[1] = endOfMonth(DateRange[1]);
      }
      setReportingPeriodDateRange([DateRange[0], DateRange[1]]);
    }
  };

  let onReportingPeriodClean = event => {
    setReportingPeriodDateRange([null, null]);
  };

  // Handler
  const handleSubmit = e => {

    e.preventDefault();
    console.log(moment(reportingPeriodDateRange[0]).format('YYYY-MM-DDTHH:mm:ss'))
    console.log(moment(reportingPeriodDateRange[1]).format('YYYY-MM-DDTHH:mm:ss'));

    // disable submit button
    setSubmitButtonDisabled(true);
    // show spinner
    setSpinnerHidden(false);
    // hide export button
    setExportButtonHidden(true)

    // Reinitialize tables
    setMeterList([]);
    getmeterslistdata()
  };

  let OfflinemeterChange = ({ target }) => {
    setOfflinemeter(target.value);
  }
  const saveChange = async (oldValue, newValue, row) => {
    if(newValue == null || newValue == '' || newValue < 0) {
      toast.error(t('API.INVALID_OFFLINE_METER_VALUE'))
      return;
    }
    let param = {
      "date": moment(reportingPeriodDateRange[0]).format('YYYY-MM'),
      "meter": Offlinemeter,
      "value": [[row.monthdate, newValue]]
    };
    let isResponseOK = false;
    await fetch(APIBaseURL + '/reports/offlinemeterinput', {
      method: 'POST',
      headers: {
        "Content-type": "application/json",
        "User-UUID": getCookieValue('user_uuid'),
        "Token": getCookieValue('token')
      },
      body: JSON.stringify(param),
    }).then(response => {
      if (response.ok) {
        isResponseOK = true;
      }
      return response.json();
    }).then(json => {
      if (isResponseOK) {
        toast.success(t('Operation Successful'));
        getmeterslistdata()
      } else {
        toast.error(t(json.description))
      }
    }).catch(err => {
      console.log(err);
    });

  }
  return (
    <Fragment>
      <div>
        <Breadcrumb>
          <BreadcrumbItem>{t('Meter Data')}</BreadcrumbItem><BreadcrumbItem active>{t('Offline Meter Input')}</BreadcrumbItem>
        </Breadcrumb>
      </div>
      <Card className="bg-light mb-3">
        <CardBody className="p-3">
          <Form onSubmit={handleSubmit}>
            <Row form>
              <Col xs={6} sm={3}>
                <FormGroup className="form-group">
                  <Label className={labelClasses} for="space">
                    {t('Offline Meter')}
                  </Label>
                  <br />
                  <CustomInput type="select" id='CustomInput'
                    onChange={OfflinemeterChange}>
                    {OfflinemeterName.map((Offlinemeter, index) => (
                      <option value={Offlinemeter.value} key={Offlinemeter.value} >
                        {t(Offlinemeter.label)}
                      </option>
                    ))}
                  </CustomInput>
                </FormGroup>
              </Col>
              <Col xs="auto">
                <FormGroup className="form-group">
                  <Label className={labelClasses} for="reportingPeriodDateRangePicker">{t('Reporting Period')}</Label>
                  <br />
                  <DateRangePicker
                    id='reportingPeriodDateRangePicker'
                    format="yyyy-MM-dd"
                    value={reportingPeriodDateRange}
                    onChange={onReportingPeriodChange}
                    size="md"
                    style={dateRangePickerStyle}
                    onClean={onReportingPeriodClean}
                    locale={dateRangePickerLocale}
                    placeholder={t("Select Date Range")}/>
                </FormGroup>
              </Col>
              <Col xs="auto">
                <FormGroup>
                  <br></br>
                  <ButtonGroup id="submit">
                    <Button color="success" disabled={submitButtonDisabled} >{t('Submit')}</Button>
                  </ButtonGroup>
                </FormGroup>
              </Col>
            </Row>
          </Form>
        </CardBody>
      </Card>
      <Fragment>
        <Card>
          <FalconCardHeader title={t('Daily Value')} className="bg-light">
          </FalconCardHeader>
          <CardBody>
            <BootstrapTable
              bootstrap4
              keyField="monthdate"
              classes='table-hover'
              data={meterList}
              bordered
              striped={true}
              columns={columns}
              defaultSorted={defaultSorted}
              cellEdit={cellEditFactory({
                mode: 'click',
                blurToSave: true,
                afterSaveCell: (oldValue, newValue, row, column) => { saveChange(oldValue, newValue, row) }
              })}
            />
          </CardBody>
        </Card>
      </Fragment>
    </Fragment>
  );
};

export default withTranslation()(withRedirect(OfflineMeterInput));
