/**
 * Created by ebinhon on 4/6/2016.
 */
import React from 'react';
import Page from '../Page';
import AppInfoStore from '../../../Store/AppInfoStore';
import EventInfoAction  from '../../../Action/EventInfoAction';
import EventInfoStore from '../../../Store/EventInfoStore';
import TripInfoStore from '../../../Store/TripInfoStore';
import List from '../../List/List';
import connectToStores from 'alt-utils/lib/connectToStores';
import moment from 'moment';
import './EventPage.scss';

@connectToStores
export default class EventPage extends React.Component {
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
            total_events: []
        }
    }

    static getStores() {
        // this will handle the listening/unlistening for you
        return [AppInfoStore, TripInfoStore, EventInfoStore];
    }

    static getPropsFromStores() {
        // this is the data that gets passed down as props
        // each key in the object returned by this function is added to the `this.props`
        let app_info = AppInfoStore.getState().body;
        let trips = TripInfoStore.getState().body;
        let events = EventInfoStore.getState().body;
        return {
            app_info: app_info,
            trips_info: trips,
            events: events
        }
    }

    readEvent(eventId){
        console.log(eventId);
        if(this.state.total_events){
            let events = this.state.total_events;
            for(let i in events){
                if(events[i].id == eventId){
                    events[i].is_read = true;
                }
            }
            this.setState(this.state);
        }
    }

    componentDidMount() {
        let trips = this.props.trips_info;
        console.log(this.props.trip_info);
        let total_events = [];
        for (let index in trips) {
            let tripid = trips[index].id;
            //TODO
            //getEvent
            EventInfoAction.loadData("http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/primary-rest/hwapGetTripEvents?tripId=" + tripid).then((response) => {
                console.log("get trip event successfully");
                let events = this.props.events;
                let eventResult = [];
                for (let i in events) {
                    let tmpEvent = {
                        "id":events[i].id,
                        "trip_id": tripid,
                        "createDate": moment(events[i].created).format("YYYY-MM-DD HH:mm"),
                        "type": events[i].type,
                        "message": events[i].message,
                        "is_read": false
                    }
                    eventResult.push(
                        tmpEvent
                    );
                    total_events.push(tmpEvent);
                }
                //total_events.push(eventResult);
                TripInfoStore.setTripEvents(tripid, eventResult);
                this.setState({
                    total_events: total_events
                });
            }).catch((error) => {
                console.log(error);
                TripInfoStore.setTripEvents(tripid, []);
            });
        }
    }

    componentWillMount() {

    }

    render() {
        return (
            <Page>
                <div className="driver_header">
                    <div className="event_tab">
                        <span className="tab_on_selected">All</span>
                        <span>Dispatches</span>
                        <span>Warnings</span>
                        <span>Vehicle</span>
                    </div>
                </div>
                <List data={this.state.total_events} buttonAction={this.readEvent.bind(this)}>
                    <div></div>
                </List>
            </Page>
        );
    }
}