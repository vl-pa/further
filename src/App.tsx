import {parse, format, isAfter, addHours, isBefore} from 'date-fns'
import { reversalRequestsJSON } from './reversalRequests';

import {
  Table,
  Header,
  HeaderRow,
  Body,
  Row,
  HeaderCell,
  Cell,
} from "@table-library/react-table-library/table";

import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";

type CustomerLocation = 'US' | 'Europe';
type RequestSource = 'web app' | 'phone';

interface RawReversalRequest {
  name: string;
  customerLocation: CustomerLocation;
  signUpDate: string;
  requestSource: RequestSource;
  investmentDate: string;
  investmentTime: string;
  refundRequestDate: string;
  refundRequestTime: string;
}

interface ReversalRequest  {
  name: string;
  customerLocation: CustomerLocation;
  signUpDate: Date;
  investmentDateTime: Date;
  refundRequestDateTime: Date;
  requestSource: RequestSource;
  isSubjectToNewTos: boolean;
  isReversalRequestApproved: boolean;
}

const US_DATE_FORMAT = 'M/d/yyyy'; 
const EUROPE_DATE_FORMAT = 'd/M/yyyy';
const NEW_TOC_CUT_OFF_DATE_EU = '2/1/2020';

function App() {

  const getDateTime = (dateSting: string, location: CustomerLocation) => {
    return location === 'Europe' 
      ? parse(dateSting, `${EUROPE_DATE_FORMAT} H:m`, new Date())
      : parse(dateSting, `${US_DATE_FORMAT} H:m`, new Date());
  };

  const getDate = (dateSting: string, location: CustomerLocation) => {
    return location === 'Europe' 
      ? parse(dateSting, EUROPE_DATE_FORMAT, new Date())
      : parse(dateSting, US_DATE_FORMAT, new Date());
  };

  const getRefundRequestApproval = (reversalRequest: Omit<ReversalRequest, 'isReversalRequestApproved'>): boolean => {
    const {isSubjectToNewTos, investmentDateTime, refundRequestDateTime, requestSource  } = reversalRequest;
    switch (requestSource) {
      case 'phone': {
        return isSubjectToNewTos 
          ? isBefore(refundRequestDateTime, addHours(investmentDateTime, 8))
          : isBefore(refundRequestDateTime, addHours(investmentDateTime, 4));
      }
      case 'web app': {
        return isSubjectToNewTos 
          ? isBefore(refundRequestDateTime, addHours(investmentDateTime, 16))
          : isBefore(refundRequestDateTime, addHours(investmentDateTime, 8));
      }
      default: return false
    }
  }

  const reversalRequests: ReversalRequest[] = JSON.parse(reversalRequestsJSON)
    .map((reversalRequest: RawReversalRequest)=> {
      const { name,
        customerLocation,
        signUpDate,
        requestSource,
        investmentDate,
        investmentTime,
        refundRequestDate,
        refundRequestTime} = reversalRequest
      return {
        name,
        customerLocation,
        signUpDate: getDate(signUpDate, customerLocation),
        investmentDateTime: getDateTime(`${investmentDate} ${investmentTime}`, customerLocation),
        refundRequestDateTime: getDateTime(`${refundRequestDate} ${refundRequestTime}`, customerLocation),
        requestSource
      }
    }).map((reversalRequest: Omit<ReversalRequest, 'isSubjectToNewTos' | 'isReversalRequestApproved'>) => ({
      ...reversalRequest,
      isSubjectToNewTos: isAfter(reversalRequest.signUpDate, getDate(NEW_TOC_CUT_OFF_DATE_EU, 'Europe'))
    })).map((reversalRequest: Omit<ReversalRequest, 'isReversalRequestApproved'>) => ({
      ...reversalRequest,
      isReversalRequestApproved: getRefundRequestApproval(reversalRequest)
    }));

    const tableData = {
      nodes: reversalRequests.map((reversalRequest, index) => ({...reversalRequest, id: index}))
    }

    const theme = useTheme(getTheme());

  return (
    <div className="App">
      <Table data={tableData} theme={theme} layout={{ fixedHeader: true }}>
        {(tableList: (ReversalRequest & { id: number; })[]) => (
          <>
            <Header>
              <HeaderRow>
                <HeaderCell>Name</HeaderCell>
                <HeaderCell>Customer Location</HeaderCell>
                <HeaderCell>Sign up date</HeaderCell>
                <HeaderCell>Investment Date and Time</HeaderCell>
                <HeaderCell>Refund Request Date and Time</HeaderCell>
                <HeaderCell>Refund Request Approved</HeaderCell>
              </HeaderRow>
            </Header>

            <Body>
              {tableList.map((item:ReversalRequest & {id: number} , index: number) => (
                <Row key={index} item={item}>
                  <Cell>{item.name}</Cell>
                  <Cell>{item.customerLocation}</Cell>
                  <Cell>{format(item.signUpDate, 'dd MMMM yyyy')}</Cell>
                  <Cell>{format(item.investmentDateTime, 'dd MMMM yyyy H:mm')}</Cell>
                  <Cell>{format(item.refundRequestDateTime, 'dd MMMM yyyy H:mm')}</Cell>
                  <Cell>{`${item.isReversalRequestApproved}`}</Cell>
                </Row>
              ))}
            </Body>
          </>
        )}
      </Table>
    </div>
  );
}

export default App;
