/**
 * Created by ebinhon on 3/22/2016.
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { GoogleMapLoader,GoogleMap, Marker, DirectionsRenderer,Circle } from "react-google-maps";
import ScriptjsLoader from "react-google-maps/lib/async/ScriptjsLoader";
import Page from '../Page';
import TripInfoStore from '../../../Store/TripInfoStore';
import AppInfoStore from '../../../Store/AppInfoStore';
import SensorInfoStore from '../../../Store/SensorInfoStore';
import SensorInfoAction from '../../../Action/SensorInfoAction';
import EventInfoStore from '../../../Store/EventInfoStore';
import EventInfoAction from '../../../Action/EventInfoAction';
import FleetDataInfoStore from '../../../Store/FleetDataInfoStore';
import FleetDataInfoAction from '../../../Action/FleetDataInfoAction';
import connectToStores from 'alt-utils/lib/connectToStores';
import Panel from '../../Panel/Panel';
import Index from '../Index/Index';
import './Dashboard.scss';
import moment from 'moment';

@connectToStores
export default class DashboardPage extends React.Component {
    static propTypes = {
        //React.PropTypes.string.isRequired,
        //React.PropTypes.bool,
        //React.PropTypes.object,
        //React.PropTypes.oneOf(['value1', 'value2'])
        //reference to official URL: https://facebook.github.io/react/docs/reusable-components.html
        tripId: React.PropTypes.string.isRequired,
        markers: React.PropTypes.arrayOf(React.PropTypes.object)
    }

    static defaultProps = {
        tripId: "",
        markers: [
            {
                position: {
                    lat: 23.1312183,
                    lng: 113.27067570000001
                },
                key: `Start`,
                defaultAnimation: 2
            },
            {
                position: {
                    lat: 23.1312983,
                    lng: 113.23067570006001
                },
                key: `End`,
                defaultAnimation: 2
            }
        ],
        origin: new google.maps.LatLng(23.1312183, 113.27067570000001),
        destination: new google.maps.LatLng(23.1312983, 113.23067570006001)
    }
    static version = Math.ceil(Math.random() * 22);

    constructor() {
        super();
        this.state = {
            zoomLevel:13,
            markers:[],
            circles: [],
            origin:null,
            destination: null,
            directions: null,
            sensor_temperature_current:"-",
            sensor_temperature_max:"20",
            sensor_temperature_set:"15",
            sensor_temperature_min:"10",
            sensor_temperature_uom: '°',
            sensor_temperature_title: 'Temperature',
            sensor_humidity_current:"-",
            sensor_humidity_max:"30",
            sensor_humidity_set:"20",
            sensor_humidity_min:"10",
            sensor_humidity_uom: '%',
            sensor_humidity_title: 'Humidity'
        }
    }

    static getStores() {
        // this will handle the listening/unlistening for you
        return [AppInfoStore, TripInfoStore, EventInfoStore, SensorInfoStore];
    }

    static getPropsFromStores() {
        // this is the data that gets passed down as props
        // each key in the object returned by this function is added to the `this.props`
        let app_info = AppInfoStore.getState().body;
        let sensor = SensorInfoStore.getState().body;
        let fleet_data = FleetDataInfoStore.getState().body;//list,and we need currentInformation
        return {
            app_info: app_info,
            events: EventInfoStore.getState().body,
            sensor: sensor,
            fleet_data: fleet_data
        }
    }

    timerGetTripData(){
        FleetDataInfoAction.loadData('http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/primary-rest/hwapGetFleetDataService')
            .then((response) => {
                console.log("load hwapGetFleetDataService successfully");
                if(this.props.fleet_data){
                    let current_trip = TripInfoStore.findTripById(this.props.trip.id);
                    console.log(current_trip);
                    let current_fleet = this.props.fleet_data;
                    for(let index in current_fleet){
                        if(current_fleet[index].vehicle.id == current_trip.vehicleId){
                            let current_info = current_fleet[index].currentInformation;
                            let trip_lat = current_info.lat;
                            let trip_lng = current_info.long;
                            let marker = {
                                position: {
                                    lat: trip_lat,
                                    lng: trip_lng
                                },
                                key: `current`,
                                defaultAnimation: 1
                            };
                            this.setState({
                                markers: [marker],
                                zoomLevel:13,
                                current_position: new google.maps.LatLng(trip_lat,trip_lng)
                            });
                            break;
                        }
                    }
                }
            }).catch((error) => {
            console.log(error);
        });
        SensorInfoAction.loadData("http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/primary-rest/getVehicleDataByVehicleId?vehicleId=" +
            this.props.trip.vehicle.id + "&tripId=" + this.props.trip.id).then((response) => {
            console.log("load current sensor successfully");
            console.log(this.props.sensor.currentInformation);
            if(this.state.sensor_temperature_title == "Pressure"){
                this.setState({
                    sensor_temperature_current: parseInt(this.props.sensor.currentInformation.pressure)
                });
            }else{
                this.setState({
                    sensor_temperature_current: parseInt(this.props.sensor.currentInformation.temperature)
                });
            }
            if(this.state.sensor_humidity_title == "Electrostatic"){
                this.setState({
                    sensor_humidity_current: parseInt(this.props.sensor.currentInformation.electrostatic)
                });
            }else{
                this.setState({
                    sensor_humidity_current: parseInt(this.props.sensor.currentInformation.humidity)
                });
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    componentDidMount() {
        //default locate GuangZhou
        let trip = this.props.trip;
        let startPoint_latitude = 23.1312183;
        let startPoint_longitude = 113.27067570000001;
        let destination_latitude = 23.1312983;
        let destination_longitude = 113.23067570006001;
        if (trip) {
            startPoint_latitude = parseFloat(trip.startPointLatitude);
            startPoint_longitude = parseFloat(trip.startPointLongitude);
            destination_latitude = parseFloat(trip.destinationLatitude);
            destination_longitude = parseFloat(trip.destinationLongitude);
            this.state.origin = new google.maps.LatLng(parseFloat(startPoint_latitude), parseFloat(startPoint_longitude));
            this.state.destination = new google.maps.LatLng(parseFloat(destination_latitude), parseFloat(destination_longitude));
            let circle = [];
            circle.push({
                lat: startPoint_latitude,
                lng: startPoint_longitude
            });
            circle.push({
                lat: destination_latitude,
                lng: destination_longitude
            });
            this.setState({
                circles: circle
            });
        }

        let intervalId = setInterval(this.timerGetTripData.bind(this), 8000);
        this.setState({
            intervalId: intervalId
        });


        if (this.props.trip) {
            //TODO
            //get sensor
            SensorInfoAction.loadData('http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/primary-rest/getVehicleById/'
                + this.props.trip.vehicle.id + "?tripId=" + this.props.trip.id).then((response) => {
                console.log("get vehicle by id successfully");
                let sensors = this.props.sensor.sensors;//list
                for(let index in sensors){
                    if(sensors[index].sensorType.sensorType == "Temperature" || sensors[index].sensorType.sensorType == "Pressure"){
                        if(sensors[index].sensorType.sensorType == "Pressure"){
                            this.setState({
                                sensor_temperature_max : sensors[index].maxThreshold,
                                sensor_temperature_set : sensors[index].standardValue,
                                sensor_temperature_min : sensors[index].minThreshold,
                                sensor_temperature_uom : "Pa",
                                sensor_temperature_title : "Pressure"
                            });
                        }else{
                            this.setState({
                                sensor_temperature_max : sensors[index].maxThreshold,
                                sensor_temperature_set : sensors[index].standardValue,
                                sensor_temperature_min : sensors[index].minThreshold
                            });
                        }
                    }else if(sensors[index].sensorType.sensorType == "Humidity" || sensors[index].sensorType.sensorType == "Electrostatic"){
                        if(sensors[index].sensorType.sensorType == "Electrostatic"){
                            this.setState({
                                sensor_humidity_max : sensors[index].maxThreshold,
                                sensor_humidity_set : sensors[index].standardValue,
                                sensor_humidity_min : sensors[index].minThreshold,
                                sensor_humidity_uom : "Kv",
                                sensor_humidity_title : "Electrostatic"
                            });
                        }else{
                            this.setState({
                                sensor_humidity_max : sensors[index].maxThreshold,
                                sensor_humidity_set : sensors[index].standardValue,
                                sensor_humidity_min : sensors[index].minThreshold
                            });
                        }
                    }
                }
                SensorInfoAction.loadData("http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/primary-rest/getVehicleDataByVehicleId?vehicleId=" +
                    this.props.trip.vehicle.id + "&tripId=" + this.props.trip.id).then((response) => {
                    console.log("load current sensor successfully");
                    console.log(this.props.sensor.currentInformation);
                    if(this.state.sensor_temperature_title == "Pressure"){
                        this.setState({
                            sensor_temperature_current: parseInt(this.props.sensor.currentInformation.pressure)
                        });
                    }else{
                        this.setState({
                            sensor_temperature_current: parseInt(this.props.sensor.currentInformation.temperature)
                        });
                    }
                    if(this.state.sensor_humidity_title == "Electrostatic"){
                        this.setState({
                            sensor_humidity_current: parseInt(this.props.sensor.currentInformation.electrostatic)
                        });
                    }else{
                        this.setState({
                            sensor_humidity_current: parseInt(this.props.sensor.currentInformation.humidity)
                        });
                    }
                }).catch((error) => {
                    console.log(error);
                });
            }).catch((error) => {
                console.log(error);
            });

            //get exists route
            const DirectionsService = new google.maps.DirectionsService();
            DirectionsService.route({
                origin: this.state.origin,
                destination: this.state.destination,
                travelMode: google.maps.TravelMode.DRIVING,
            }, (result, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    this.setState({
                        directions: result
                    });
                } else {
                    console.error(`error fetching directions ${ result }`);
                }
            });

            //draw current position
            if(this.props.fleet_data){
                let current_trip = TripInfoStore.findTripById(this.props.trip.id);
                console.log(current_trip);
                let current_fleet = this.props.fleet_data;
                for(let index in current_fleet){
                    if(current_fleet[index].vehicle.id == current_trip.vehicleId){
                        let current_info = current_fleet[index].currentInformation;
                        let trip_lat = current_info.lat;
                        let trip_lng = current_info.long;
                        let marker = {
                            position: {
                                lat: trip_lat,
                                lng: trip_lng
                            },
                            key: `current`,
                            defaultAnimation: 1
                        };
                        this.setState({
                            markers: [marker]
                        });
                    }
                }
            }
        }
    }

    componentWillMount() {

    }

    componentWillUnmount(){
        clearInterval(this.state.intervalId);
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

    initVehiclePanel() {
        let items = [];
        //registration, brand, model
        console.log("init vehicle panel");
        if (this.props.trip && this.props.trip.vehicle) {
            items.push({
                "label": "Registration",
                "value": this.props.trip.vehicle.registration,
                "editable":false
            });
            items.push({
                "label":"Brand",
                "value": this.props.trip.vehicle.brand,
                "editable":false
            });
            items.push({
                "label":"Model",
                "value": this.props.trip.vehicle.model,
                "editable":false
            });
        } else {
            items.push({
                "label": "Registration",
                "value": "",
                "editable":false
            });
            items.push({
                "label":"Brand",
                "value": "",
                "editable":false
            });
            items.push({
                "label":"Model",
                "value": "",
                "editable":false
            });
        }
        return items;
    }

    initDriverPanel() {
        let items = [];
        //registration, brand, model
        console.log("init driver panel");
        if (this.props.trip && this.props.trip.vehicle && this.props.trip.vehicle.driver) {
            let driver_id = this.expandJSONObject(this.props.trip.vehicle.driver)[0];
            items.push({
                "label":"Name",
                "value": this.props.trip.vehicle.driver[driver_id].firstName + " " + this.props.trip.vehicle.driver[driver_id].lastName,
                "editable":false
            });
            items.push({
                "label":"Phone",
                "value": this.props.trip.vehicle.driver[driver_id].phoneNumber,
                "editable":false
            });
        } else {
            items.push({
                "label":"Name",
                "value": "",
                "editable":false
            });
            items.push({
                "label":"Phone",
                "value": "",
                "editable":false
            });
        }
        return items;
    }

    initPickUpPanel() {
        let items = [];
        console.log("init Pick-up panel");
        if (this.props.trip) {
            items.push({
                "label": "Customer",
                "value": this.props.trip.customer,
                "type": "customer",
                "editable": false
            });
            items.push({
                "label": "Cargo",
                "value": this.props.trip.cargoName,
                "type": "cargo_name",
                "editable": false
            });
            items.push({
                "label": "Qty",
                "value": this.props.trip.quantity + " " + this.props.trip.uoM,
                "type": "quantity",
                "editable": false
            });
        } else {
            items.push({
                "label": "Customer",
                "value": "",
                "type": "customer",
                "editable": false
            });
            items.push({
                "label": "Cargo",
                "value": "",
                "type": "cargo_name",
                "editable": false
            });
            items.push({
                "label": "Qty",
                "value": "",
                "type": "quantity",
                "editable": false
            });
        }
        return items;
    }

    initDropOffPanel() {
        let items = [];
        console.log("init drop-off panel");
        if (this.props.trip) {
            items.push({
                "label": "Pick up at",
                "value": moment(this.props.trip.startTime).format("YYYY-MM-DD HH:mm"),
                "type": "plannedStartTime",
                "editable": false
            });
            items.push({
                "label": "Drop off at",
                "value": moment(this.props.trip.arriveTime).format("YYYY-MM-DD HH:mm"),
                "type": "plannedArriveTime",
                "editable": false
            });
        } else {
            let items = [];
            console.log("init Drop-off panel");
            items.push({
                "label": "Pick up at",
                "value": "",
                "type": "plannedStartTime",
                "editable": false
            });
            items.push({
                "label": "Drop off at",
                "value": "",
                "type": "plannedArriveTime",
                "editable": false
            });
            return items;
        }
        return items;
    }

    initAdditionPanel() {
        let items = [];
        if (this.props.trip) {
            items.push({
                "label": "Location",
                "value": this.props.trip.startPointAddress,
                "type": "startPoint_address",
                "editable": false
            });
            items.push({
                "label": "Location",
                "value": this.props.trip.destinationAddress,
                "type": "destination_address",
                "editable": false
            });
        }else {
            items.push({
                "label": "Location",
                "value": "",
                "type": "startPoint_address",
                "editable": false
            });
            items.push({
                "label": "Location",
                "value": "",
                "type": "destination_address",
                "editable": false
            });
        }
        return items;
    }

    initTemperaturePanel(){
        let items = [];
        items.push(
            <Panel key="temperature" title={this.state.sensor_temperature_title + " (Celsius)"} data={[]}>
                <div key="temperature" className="sensor_temperature_panel">
                    <div className="current_temperature">{this.state.sensor_temperature_current + this.state.sensor_temperature_uom}</div>
                    <div className="sensor_temperature">
                        <div className="sensor_min"><span>{this.state.sensor_temperature_min + this.state.sensor_temperature_uom}</span></div>
                        <div className="sensor_set"><img src="../../images/icon_slidervalue-01.svg" /><span>{this.state.sensor_temperature_set + this.state.sensor_temperature_uom}</span></div>
                        <div className="sensor_max"><span>{this.state.sensor_temperature_max + this.state.sensor_temperature_uom}</span></div>
                    </div>
                </div>
            </Panel>
        );
        return items;
    }
    initHumidityPanel(){
        let items = [];

        items.push(
            <Panel key="humidity" title={this.state.sensor_humidity_title + " (Relative)"} data={[]}>
                <div key="humidity" className="sensor_humidity_panel">
                    <div className="current_humidity">{this.state.sensor_humidity_current + this.state.sensor_humidity_uom}</div>
                    <div className="sensor_humidity">
                        <div className="sensor_min"><span>{this.state.sensor_humidity_min + this.state.sensor_humidity_uom}</span></div>
                        <div className="sensor_set"><img src="../../images/icon_slidervalue-01.svg" /><span>{this.state.sensor_humidity_set + this.state.sensor_humidity_uom}</span></div>
                        <div className="sensor_max"><span>{this.state.sensor_humidity_max + this.state.sensor_humidity_uom}</span></div>
                        {/*<div className="sensor_min_label">LOW</div>
                        <div className="sensor_set_label">SET</div>
                        <div className="sensor_max_label">HIGH</div>*/}
                    </div>
                </div>
            </Panel>
        );
        return items;
    }

    initDashboardHeaderInfo(){
        let item = [];
        let trip_status = this.props.trip.status;
        let customer = this.props.trip.customer;
        let dispatch_status = "";
        //icon_dispatch-01.svg
        if(trip_status == "ASSIGNED"){
            dispatch_status = "NEW JOB DISPATCH";
        }else if(trip_status == "STARTED"){
            dispatch_status = "ONGOING ASSIGNMENT";
        }else if(trip_status == "CLOSED"){
            dispatch_status = "DISPATCH";
        }
        item.push(
            <div key="header_information">
                <div className="dispatch_image">
                    <img src="../../images/icon_dispatch-01.svg" alt=""/>
                </div>
                <div className="dispatch_header">
                    <div className="dispatch-status">{dispatch_status}</div>
                    {/*<div className="dispatch_customer">From: {customer}</div>*/}
                </div>
            </div>
        );

        return item;
    }

    initOperationButton(){
        let item = [];
        let trip_status = this.props.trip.status;
        //ASSIGNED, ACCEPTED, STARTED, CLOSED
        if(trip_status == "CLOSED"){
            item.push(
                <div key="button">
                    <button onClick={this.props.closeFunction.bind(this)} className="driver_dashboard_button button_selected">Closed</button>
                </div>
            );
        }
        if(trip_status == "STARTED"){
            item.push(
                <div key="button">
                    <button onClick={this.props.closeFunction.bind(this)} className="driver_dashboard_button button_selected">Closed</button>
                    <button onClick={this.props.finishEvent.bind(this,this.props.trip)} className="driver_dashboard_button button_unselected" >FINISH</button>
                </div>
            );
        }
        if(trip_status == "ACCEPTED"){
            item.push(
                <div key="button">
                    <button onClick={this.props.closeFunction.bind(this)} className="driver_dashboard_button button_selected">LATER</button>
                    <button onClick={this.props.startEvent.bind(this,this.props.trip)} className="driver_dashboard_button button_unselected">START</button>
                </div>
            );
        }
        if(trip_status == "ASSIGNED"){
            item.push(
                <div key="button">
                    <button onClick={this.props.closeFunction.bind(this)} className="driver_dashboard_button button_selected">LATER</button>
                    <button onClick={this.props.acceptEvent.bind(this,this.props.trip)} className="driver_dashboard_button button_unselected">ACCEPT</button>
                </div>
            );
        }
        return item;
    }

    clickEvent(value){
        console.log(value);
    }

    render() {
        let dashboard_header_info = this.initDashboardHeaderInfo();
        let operation_button = this.initOperationButton();
        let pickup_panel_content = this.initPickUpPanel();
        let dropoff_panel_content = this.initDropOffPanel();
        let addition_panel = this.initAdditionPanel();
        let temperature_panel = this.initTemperaturePanel();
        let humidity_panel = this.initHumidityPanel();
        let events_Data = [];
        let empty = [];
        const directions = this.state.directions;
        return (
            <Page>
                <div className="vehicle_driver">
                    <div className="driver_dashboard_header_info">
                        {dashboard_header_info}
                    </div>
                    <div className="driver_dashboard_operation">
                        {operation_button}
                    </div>
                    {/*<div className="vehicle_panel">
                        <Panel title="Vehicle" data={vehicle_panel_content}/>
                    </div>
                    <div className="driver_panel">
                        <Panel title="Driver" data={driver_panel_content}/>
                    </div>*/}
                </div>
                <GoogleMapLoader
                    containerElement={
                        <div className="map_panel"></div>
                    }
                    googleMapElement={
                        <GoogleMap
                          ref="map"
                          zoom={this.state.zoomLevel}
                          center={this.state.current_position? this.state.current_position : this.props.origin}
                        >
                        {this.state.circles.map((circle, index) => {
                            return (
                                <Circle key={"circle" + index} center={circle} radius={500} options={{
                                          fillColor: `red`,
                                          fillOpacity: 0,
                                          strokeColor: `red`,
                                          strokeOpacity: 1,
                                          strokeWeight: 1,
                                        }}
                                    />
                            );
                        })}
                        {directions ? <DirectionsRenderer directions={directions} /> : null}
                        {this.state.markers.map((marker, index) => {
                              return (
                                <Marker
                                  {...marker}
                                />
                              );
                            })}
                        </GoogleMap>
                    }
                />
                <div className="detail_panel">
                    <Panel title="Assignment Detail" data={empty}>
                        <div className="trip_detail_panel">
                            <div className="pickup_panel">
                                <Panel title="" data={pickup_panel_content} />
                            </div>
                            <div className="dropdown_panel">
                                <Panel title="" data={dropoff_panel_content}/>
                            </div>
                            <div className="addition_panel">
                                <Panel title="" data={addition_panel} />
                            </div>
                        </div>
                    </Panel>
                </div>
                <div className="sensor_panel">
                        {temperature_panel}
                        {humidity_panel}
                </div>
            </Page>
        );
    }
}