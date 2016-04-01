/**
 * Created by ebinhon on 3/2/2016.
 */
import React from 'react';
import Page from '../Page';
import AppInfoStore from '../../../Store/AppInfoStore';
import AppInfoAction from '../../../Action/AppInfoAction';
import TripInfoStore from '../../../Store/TripInfoStore';
import TripInfoAction from '../../../Action/TripInfoAction';
import RouteInfoAction from '../../../Action/RouteInfoAction';
import RouteInfoStore from '../../../Store/RouteInfoStore';
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
        return [AppInfoStore,TripInfoStore];
    }

    static getPropsFromStores() {
        // this is the data that gets passed down as props
        // each key in the object returned by this function is added to the `this.props`
        let trip_info = TripInfoStore.getState().body;
        let app_info = AppInfoStore.getState().body;
        return {
            trip_info: trip_info,
            driver_name: app_info.firstName + " " + app_info.lastName,
            app_info: app_info
        }
    }

    static propTypes = {
        //React.PropTypes.string.isRequired,
        //React.PropTypes.bool,
        //React.PropTypes.object,
        //React.PropTypes.oneOf(['value1', 'value2'])
        //reference to official URL: https://facebook.github.io/react/docs/reusable-components.html
    }

    static defaultProps = {

    }

    constructor() {
        super();
        this.state = {
            data:[],
            directions: null,
            current_trip:null
        }
    }


    timerGetTripData(){
        let postJSON = {
            fleetId: this.props.app_info.fleetId,
            enterpriseId: this.props.app_info.enterpriseId,
            role: this.props.app_info.userRole
        }
        AppInfoStore.setPostJSON(postJSON);
        //TODO
        //for remote: http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/primary/7a3b8bdd-7350-42fa-89fc-50eb61974d0b/_/fleetcontrol-1
        // fleetId, enterpriseId, userRole
        //TripInfoAction.postData('./Asset/data/tripinfo.json',JSON.stringify(postJSON)).then((response) => {
        TripInfoAction.postData('http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/primary-rest/getTripPlanning',JSON.stringify(postJSON)).then((response) => {
            console.log('load Trip Info Successfully');
            this.setState({
                data: this.props.trip_info
            });
        }).catch((error) => {
            console.log(error);
        })
    }

    componentWillUnmount(){
        clearInterval(this.timerGetTripData);
    }

    componentDidMount(){
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
        setInterval(this.timerGetTripData, 8000);
    }

    expandJSONObject(jsonObject){
        let keys = [];
        for(let key in jsonObject){
            keys.push(
                key
            );
        }
        return keys;
    }

    renderData(){

    }

    selectTrip(tripId){
        console.log(tripId);
        if(tripId){
            let trip = TripInfoStore.findTripById(tripId);
            this.setState({
                current_trip: trip
            });
        }
    }

    closeDashboard(){
        console.log("close dashboard");
        this.setState({
            current_trip: null
        });
    }

    showDashboard(){
        let content = [];
        if(this.state.current_trip){
            content.push(
                <div key="dashboard" className="driver_dashboard">
                    <div className="driver_dashboard_content">
                        <DashboardPage trip={this.state.current_trip} closeFunction={this.closeDashboard.bind(this)} startEvent={this.submitstartEvent.bind(this)} finishEvent={this.submitFinishEvent.bind(this)}/>
                    </div>
                </div>
            );
        }
        return content;
    }

    showEvent(trip){
        this.selectTrip(trip.id);
    }

    submitstartEvent(trip){
        console.log(trip);
        let vin = trip.vehicle.vin;
        let routeId = trip.routeId;
        RouteInfoAction.loadData("http://http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/telematics/ route/" + vin +"/start?routeid=" + routeId ).then((response) => {
            console.log("stop successfully");
            this.closeDashboard();
        }).catch((error) => {
            console.log(error);
        });
    }

    submitFinishEvent(trip){
        //sent post ajax to finish trip
        console.log(trip);
        let vin = trip.vehicle.vin;
        RouteInfoAction.loadData("http://http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/telematics/ route/" + vin +"/stop").then((response) => {
            console.log("stop successfully");
            this.closeDashboard();
        }).catch((error) => {
            console.log(error);
        });
    }
    render() {
        return(
            <Page>
                <Header title={"Driver"} content={this.props.driver_name} button={"true"}/>
                <div className="calendar_list">
                    <Calendar showEvent={this.showEvent.bind(this)} showDashboard={this.selectTrip.bind(this)} ref="calendar" events={this.state.data} />
                </div>
                {this.showDashboard()}
            </Page>
        );
    }
}