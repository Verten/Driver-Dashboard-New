/**
 * Created by ebinhon on 3/22/2016.
 */
import React from 'react';
import ReactDOM from 'react-dom';
import FaSpinner from "react-icons/fa/spinner";
import { GoogleMapLoader,GoogleMap, Marker, DirectionsRenderer,Polyline } from "react-google-maps";
import ScriptjsLoader from "react-google-maps/lib/async/ScriptjsLoader";
import Page from '../Page';
import TripInfoStore from '../../../Store/TripInfoStore';
import AppInfoStore from '../../../Store/AppInfoStore';
import SensorInfoStore from '../../../Store/SensorInfoStore';
import SensorInfoAction from '../../../Action/SensorInfoAction';
import EventInfoStore from '../../../Store/EventInfoStore';
import EventInfoAction from '../../../Action/EventInfoAction';
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
            origin:null,
            destination: null,
            directions: null,
            sensor_temperature_current:"14.5",
            sensor_temperature_max:"20",
            sensor_temperature_set:"15",
            sensor_temperature_min:"10",
            sensor_humidity_current:"20",
            sensor_humidity_max:"30",
            sensor_humidity_set:"20",
            sensor_humidity_min:"10"
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
        return {
            app_info: app_info,
            events: EventInfoStore.getState().body,
            sensor: sensor
        }
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
        }

        //TODO
        //get events
        EventInfoAction.loadData("http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/primary-rest/hwapGetTripEvents?tripId=" + this.props.trip.id).then((response) => {
            console.log("get trip event successfully");
            let events = this.props.events;
            let eventResult = [];
            for(let index in events){
                let tmpEvent = {
                    "createDate": moment(events[index].created),
                    "type": events[index].type,
                    "message": events[index].message
                }
                eventResult.push(
                    tmpEvent
                );
            }
            this.setState({
                events: eventResult
            });
        }).catch((error) => {
            console.log(error);
        });

        if (this.props.trip) {
            //TODO
            //get sensor
            SensorInfoAction.loadData('http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/primary-rest/getVehicleById/'
                + this.props.trip.vehicle.id + "?tripId=" + this.props.trip.id).then((response) => {
                console.log("get vehicle by id successfully");
                let sensors = this.props.sensor.sensors;//list
                for(let index in sensors){
                    if(sensors[index].sensorType.sensorType == "temperature"){
                        this.setState({
                            sensor_temperature_max : sensors[index].maxThreshold,
                            sensor_temperature_set : sensors[index].standardValue,
                            sensor_temperature_min : sensors[index].minThreshold
                        });
                    }else if(sensors[index].sensorType.sensorType == "humidity"){
                        this.setState({
                            sensor_humidity_max : sensors[index].maxThreshold,
                            sensor_humidity_set : sensors[index].standardValue,
                            sensor_humidity_min : sensors[index].minThreshold
                        });
                    }
                }
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
        }
    }

    componentWillMount() {

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
                "value": "",
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
            <div key="temperature" className="sensor_temperature_panel">
                <div className="current_temperature">{this.state.sensor_temperature_current}&deg;</div>
                <div className="sensor_temperature">
                    <div className="sensor_min"><span>{this.state.sensor_temperature_min}&deg;</span></div>
                    <div className="sensor_set"><img src="./Asset/images/icon_slidervalue-01.svg" /><span>{this.state.sensor_temperature_set}&deg;</span></div>
                    <div className="sensor_max"><span>{this.state.sensor_temperature_max}&deg;</span></div>
                </div>
            </div>
        );
        return items;
    }
    initHumidityPanel(){
        let items = [];

        items.push(
            <div key="humidity" className="sensor_humidity_panel">
                <div className="current_humidity">{this.state.sensor_humidity_current}%</div>
                <div className="sensor_humidity">
                    <div className="sensor_min"><span>{this.state.sensor_humidity_min}%</span></div>
                    <div className="sensor_set"><img src="./Asset/images/icon_slidervalue-01.svg" /><span>{this.state.sensor_humidity_set}%</span></div>
                    <div className="sensor_max"><span>{this.state.sensor_humidity_max}%</span></div>
                    {/*<div className="sensor_min_label">LOW</div>
                    <div className="sensor_set_label">SET</div>
                    <div className="sensor_max_label">HIGH</div>*/}
                </div>
            </div>
        );
        return items;
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
        return item;
    }

    clickEvent(value){
        console.log(value);
    }

    render() {
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
                    loadingElement={
                        <div style={{
                              height: `100%`
                            }}>
                          <FaSpinner  style={{
                                                display: `block`,
                                                width: 100,
                                                height: 100,
                                                margin: `60px auto`,
                                                animation: `fa-spin 2s infinite linear`
                                            }}
                          />
                        </div>
                    }
                    containerElement={
                        <div className="map_panel"></div>
                    }
                    googleMapElement={
                        <GoogleMap
                          defaultZoom={13}
                          defaultCenter={this.props.origin}
                        >
                        {directions ? <DirectionsRenderer directions={directions} /> : null}
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
                    <Panel key="temperature" title="Temperature (Celsius)" data={[]}>
                        {temperature_panel}
                    </Panel>
                    <Panel key="humidity" title="Humidity (Relative)" data={[]}>
                        {humidity_panel}
                    </Panel>
                </div>
            </Page>
        );
    }
}