/**
 * Created by ebinhon on 3/2/2016.
 */
import React from 'react';
import Page from '../Page';
import AppInfoStore from '../../../Store/AppInfoStore';
import TripInfoStore from '../../../Store/TripInfoStore';
import TripInfoAction from '../../../Action/TripInfoAction';
import RouteInfoAction from '../../../Action/RouteInfoAction';
import RouteInfoStore from '../../../Store/RouteInfoStore';
import FleetDataInfoAction from '../../../Action/FleetDataInfoAction';
import FleetDataInfoStore from '../../../Store/FleetDataInfoStore';
import Header from '../../Header/Header';
import Calendar from '../../Calendar/Calendar';
import DashboardPage from '../Dashboard/DashboardPage';
import connectToStores from 'alt-utils/lib/connectToStores';
import moment from 'moment';

import './Index.scss';

@connectToStores
export default class IndexPage extends React.Component {
    static getStores() {
        // this will handle the listening/unlistening for you
        return [AppInfoStore, TripInfoStore, FleetDataInfoStore];
    }

    static getPropsFromStores() {
        // this is the data that gets passed down as props
        // each key in the object returned by this function is added to the `this.props`
        let trip_info = TripInfoStore.getState().body;
        let phone = trip_info ? trip_info[0] ? trip_info[0].vehicle.driver.phoneNumber : "" : "";
        let app_info = AppInfoStore.getState().body;
        let fleet_data = FleetDataInfoStore.getState().body;//list,and we need currentInformation
        return {
            trip_info: trip_info,
            driver_name: app_info.firstName + " " + app_info.lastName,
            app_info: app_info,
            fleet_data: fleet_data,
            phone: phone
        }
    }

    static propTypes = {
        //React.PropTypes.string.isRequired,
        //React.PropTypes.bool,
        //React.PropTypes.object,
        //React.PropTypes.oneOf(['value1', 'value2'])
        //reference to official URL: https://facebook.github.io/react/docs/reusable-components.html
    }

    static defaultProps = {}

    constructor() {
        super();
        this.state = {
            data: [],
            directions: null,
            current_trip: null
        }
    }


    timerGetTripData() {
        let postJSON = {
            userId: this.props.app_info.userId,
            fleetId: this.props.app_info.fleetId,
            enterpriseId: this.props.app_info.enterpriseId,
            role: this.props.app_info.userRole
        };
        AppInfoStore.setPostJSON(postJSON);
        //TODO
        TripInfoAction.loadData('http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/primary-rest/hwapGetTripPlanning?body=' + encodeURI(JSON.stringify(postJSON))).then((response) => {
            console.log('load Trip Info Successfully');
            this.setState({
                data: this.props.trip_info
            });
        }).catch((error) => {
            console.log(error);
        });
        //FleetDataInfoAction.loadData('http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/primary-rest/hwapGetFleetDataService')
        //    .then((response) => {
        //        console.log("load hwapGetFleetDataService successfully");
        //    }).catch((error) => {
        //    console.log(error);
        //});
    }

    componentWillUnmount() {
        clearInterval(this.state.intervalId);
    }

    componentWillMount(){}

    componentDidMount() {
        console.log('Created "index page"');
        //for remote: http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/primary/7a3b8bdd-7350-42fa-89fc-50eb61974d0b/_/fleetcontrol-1
        //TripInfoAction.loadData('./Asset/data/tripinfo.json').then((response) => {
        //    console.log('load Trip Info Successfully');
        //    this.setState({
        //        data: this.props.trip_info
        //    });
        //}).catch((error) => {
        //    console.log(error);
        //});
        //todo
        let postJSON = {
            userId: this.props.app_info.userId,
            fleetId: this.props.app_info.fleetId,
            enterpriseId: this.props.app_info.enterpriseId,
            role: this.props.app_info.userRole
        }
        TripInfoAction.loadData('http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/primary-rest/hwapGetTripPlanning?body=' + encodeURI(JSON.stringify(postJSON))).then((response) => {
            console.log('load Trip Info Successfully');
            this.setState({
                data: this.props.trip_info
            });
        }).catch((error) => {
            console.log(error);
        })

        let intervalId = setInterval(this.timerGetTripData.bind(this), 8000);
        this.setState({
            intervalId: intervalId
        });
    }

    expandJSONObject(jsonObject) {
        let keys = [];
        for (let key in jsonObject) {
            keys.push(
                key
            );
        }
        return keys;
    }

    renderData() {

    }

    selectTrip(tripId) {
        console.log(tripId);
        if (tripId) {
            let trip = TripInfoStore.findTripById(tripId);
            this.setState({
                current_trip: trip
            });
        }
    }

    closeDashboard() {
        console.log("close dashboard");
        this.timerGetTripData.bind(this);
        this.setState({
            current_trip: null
        });
    }

    showDashboard() {
        let content = [];
        if (this.state.current_trip) {
            content.push(
                <div key="dashboard" className="driver_dashboard">
                    <div className="driver_dashboard_content">
                        <DashboardPage trip={this.state.current_trip} closeFunction={this.closeDashboard.bind(this)}
                                       startEvent={this.submitstartEvent.bind(this)}
                                       finishEvent={this.submitFinishEvent.bind(this)}
                                       acceptEvent={this.submitAcceptEvent.bind(this)}/>
                    </div>
                </div>
            );
        }
        return content;
    }

    showEvent(trip) {
        this.selectTrip(trip.id);
    }

    submitstartEvent(trip) {
        console.log(trip);
        let vin = trip.vehicle.vin;
        let routeId = trip.routeId;
        RouteInfoAction.loadData("http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/simulator/telematics/route/" + vin + "/start?routeid=" + routeId).then((response) => {
            console.log("start successfully");
            //update trip status
            let tripId = trip.id;
            let dataJSON = {
                tripPlanningId: tripId,
                status: "STARTED"
            }
            TripInfoAction.loadData("http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/primary-rest/hwapUpdateTripPlanning?body="
                + encodeURI(JSON.stringify(dataJSON))).then((response) => {
                console.log("update status successfully, STARTED");
            }).catch((error) => {
                console.log(error);
            });
            trip.status = "STARTED";
            this.setState(this.state);
            //this.closeDashboard();
        }).catch((error) => {
            console.log(error);
        });
    }

    submitFinishEvent(trip) {
        //sent post ajax to finish trip
        console.log(trip);
        let vin = trip.vehicle.vin;
        RouteInfoAction.loadData("http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/simulator/telematics/route/" + vin + "/stop").then((response) => {
            console.log("stop successfully");
            let tripId = trip.id;
            let dataJSON = {
                tripPlanningId: tripId,
                status: "CLOSED"
            }
            TripInfoAction.loadData("http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/primary-rest/hwapUpdateTripPlanning?body="
                + encodeURI(JSON.stringify(dataJSON))).then((response) => {
                console.log("update status successfully, CLOSED");
            }).catch((error) => {
                console.log(error);
            });
            trip.status = "CLOSED";
            this.setState(this.state);
            //this.closeDashboard();
        }).catch((error) => {
            console.log(error);
        });
    }

    //body={"tripPlanningId":"tripid","status":"ACCEPTED"}
    //status=[ASSIGNED, ACCEPTED, STARTED, CLOSED]
    submitAcceptEvent(trip) {
        //sent post ajax to accept trip
        console.log(trip);
        let tripId = trip.id;
        let dataJSON = {
            tripPlanningId: tripId,
            status: "ACCEPTED"
        }
        TripInfoAction.loadData("http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/primary-rest/hwapUpdateTripPlanning?body="
            + encodeURI(JSON.stringify(dataJSON))).then((response) => {
            console.log("update status successfully, ACCEPTED");
            trip.status = "ACCEPTED";
            this.setState(this.state);
            //this.closeDashboard();
        }).catch((error) => {
            console.log(error);
        });
    }

    render() {
        return (
            <Page>
                <Header title={"Driver"} phone={this.props.phone} content={this.props.driver_name} button={"true"}/>
                <div className="calendar_list">
                    <Calendar showEvent={this.showEvent.bind(this)} showDashboard={this.selectTrip.bind(this)}
                              startEvent={this.submitstartEvent.bind(this)}
                              finishEvent={this.submitFinishEvent.bind(this)}
                              acceptEvent={this.submitAcceptEvent.bind(this)}
                              ref="calendar" events={this.props.trip_info}/>
                </div>
                {this.showDashboard()}
            </Page>
        );
    }
}