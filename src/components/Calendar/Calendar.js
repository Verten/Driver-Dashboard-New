/**
 * Created by ebinhon on 3/28/2016.
 */
import React from 'react';
import moment from 'moment';
import './Calendar.scss';

export default class Calendar extends React.Component {
    static propTypes = {
        //React.PropTypes.string.isRequired,
        //React.PropTypes.bool,
        //React.PropTypes.object,
        //React.PropTypes.oneOf(['value1', 'value2'])
        //reference to official URL: https://facebook.github.io/react/docs/reusable-components.html
        day:React.PropTypes.object,
        events:React.PropTypes.arrayOf(React.PropTypes.object).isRequired
    }

    static defaultProps = {
        day: moment()
    }

    constructor() {
        super();
        this.state = {
            day: moment()

        }
    }

    changeDate(date){
        this.setState({
            day:date
        });
    }

    componentDidMount(){
        this.setState({
            day: this.props.day
        });
    }

    initWeather(){
        let item = [];

        let weatheritem = ["weather_cloud-01.svg","weather_cloudnight-01.svg","weather_flashstorm-01.svg",
            "weather_partlycloud-01.svg","weather_rainny-01.svg","weather_sunny-01.svg","weather_wind-01.svg"];

        let index = Math.floor(Math.random()*7);

        let weatherStr = Math.floor(Math.random()*10 + 20);

        item.push(
            <div key="weather" className="weather_detail">
                <img src={"./Asset/images/"+ weatheritem[index]} />
                <span>{weatherStr}&deg;</span>
            </div>
        );


        return item;
    }

    renderDayTime(){
        let times = [];
        let current = moment(this.state.day);
        let current_hour = current.format("HH");
        let hours = ["6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23"];//"0","1","2","3","4","5",
        //from 00:00 -> 23:59,00:00 -> 01:00
        let style = "";
        let indicate = "";
        for(let index in hours){
            if(index == hours.length - 1){
            }
            if(hours[index] < 12){
                indicate = hours[index] + " AM";
            }else if(hours[index] == 12){
                indicate = "Noon";
            }else if(hours[index] > 12){
                indicate = hours[index] + " PM";
            }
            if(hours[index]  == parseInt(current_hour)){
                style = "calendar_hour_item ";//current_hours
            }else{
                style = "calendar_hour_item";
            }
            times.push(
                <div className={style} key={index}>
                    <div>
                        <span className="from">{indicate}</span>
                        <span className="hour_weather">{this.initWeather()}</span>
                    </div>
                </div>
            );
        }

        return times;
    }


    renderEventsDiv(){
        let event_item = [];
        let events = this.props.events;
        let day = this.state.day;
        let hours = ["6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23"];//"0","1","2","3","4","5",
        let day_hour = moment(day).format("HH");
        let style = "";
        for(let index in hours){
            if(hours[index] == parseInt(day_hour)){
                style = "calendar_event_item current_event";//
            }else if(this.renderEvents(events,hours[index],day).length != 0){
                style = "calendar_event_item list_event";
            }else{
                style = "calendar_event_item";
            }

            event_item.push(
                <div className={style} key={index}>
                    {this.renderEvents(events,hours[index],day)}
                </div>
            );
        }
        console.log("render calendar event done");
        return event_item;
    }

    renderEvents(events,hour,date){
        let events_item = [];
        let day_str = moment(date).format("DD");
        for(let index in events){
            if (parseInt(moment(events[index].plannedStartTime).format("DD")) == parseInt(day_str) &&
                parseInt(moment(events[index].plannedStartTime).format("HH")) == parseInt(hour)) {
                events_item.push(
                    <div key={index} onClick={this.props.showDashboard.bind(this,events[index].id)}>
                        <div className="event_panel_startaddress">
                            {events[index].startPointAddress}
                        </div>
                        <div className="event_panel_detail">
                            <span>{events[index].cargoName}</span>
                            <span>{events[index].customer}</span>
                        </div>
                    </div>
                );
            }
        }
        return events_item
    }


    setDate(day){
        this.setState({
            day:moment(this.state.day).add(day,'days')
        });
    }

    renderCalendarHader(){
        let header = [];
        let title = moment(this.state.day).format("MMMM YYYY");
        let before_before_yeasterday = moment(this.state.day).add(-3, 'days').format("D ddd");
        let before_yeasterday = moment(this.state.day).add(-2, 'days').format("D ddd");
        let yeasterday = moment(this.state.day).add(-1, 'days').format("D ddd");
        let today = moment(this.state.day).format("D ddd");
        let tomorrow = moment(this.state.day).add(1, 'days').format("D ddd");
        let after_tomorrow = moment(this.state.day).add(2, 'days').format("D ddd");
        let after_after_tomorrow = moment(this.state.day).add(3, 'days').format("D ddd");

        header.push(
            <div className="calendar_title_content" key="header">
                <div className="calendar_title_content_1">
                    <div className="calendar_current_month">
                        {title}
                    </div>
                    <div className="calendar_tab">
                        <span className="tab_on_selected">Day</span>
                        <span>Week</span>
                        <span>Month</span>
                        <span>Year</span>
                    </div>
                </div>
                <div className="calendar_title_content_2">
                    <div onClick={this.setDate.bind(this,-3)} className="">{before_before_yeasterday}</div>
                    <div onClick={this.setDate.bind(this,-2)} className="">{before_yeasterday}</div>
                    <div onClick={this.setDate.bind(this,-1)} className="">{yeasterday}</div>
                    <div onClick={this.setDate.bind(this,0)} className="label_on_selected">{today}</div>
                    <div onClick={this.setDate.bind(this,1)} className="">{tomorrow}</div>
                    <div onClick={this.setDate.bind(this,2)} className="">{after_tomorrow}</div>
                    <div onClick={this.setDate.bind(this,3)} className="">{after_after_tomorrow}</div>
                </div>
            </div>
        );
        return header;
    }

    render() {
        let title = this.renderCalendarHader();
        return(
            <div className="calendar_panel">
                <div className="calendar_title">{title}</div>
                <div className="calendar_detail">
                    <div className="calendar_day">{this.renderDayTime()}</div>
                    <div className="calendar_event">{this.renderEventsDiv()}</div>
                </div>
            </div>
        );
    }
}