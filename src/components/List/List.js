/**
 * Created by ebinhon on 3/3/2016.
 */
import React from 'react';
import './List.scss';

export default class List extends React.Component {
    static propTypes = {
        //React.PropTypes.string.isRequired,
        //React.PropTypes.bool,
        //React.PropTypes.object,
        //React.PropTypes.oneOf(['value1', 'value2'])
        //reference to official URL: https://facebook.github.io/react/docs/reusable-components.html
        children: React.PropTypes.element.isRequired,
        style: React.PropTypes.string
    }

    static defaultProps = {
        style: 'list',
    }

    constructor() {
        super();
        this.state = {
            //default
            data:[]
        }
    }

    componentDidMount(){

    }

    drawButton(eventId){
        let button = [];

        button.push(
            <span key="button" className="event_operation">
                <button onClick={this.props.buttonAction.bind(this,eventId)} className="event_button button_selected">ACKNOWLEDGE</button>
            </span>
        );

        return button;
    }

    drawEventImage(type){
        //warning
        let image = [];
        
        if("warning" == type.toLowerCase()){
            image.push(
                <span className="event_image">
                    <img src="../../images/icon_warning-01.svg" alt="warning"/>
                </span>
            );
        }else{
            image.push(
                <span className="event_image">
                    <img src="../../images/icon_info-01.svg" alt="info"/>
                </span>
            );
        }
        
        return image;
    }

    renderListData(){
        console.log('init list panel');
        let data_list = this.props.data;
        let list_items = [];
        for (let index in data_list){
            list_items.push(
                <div key={index} className="child_list">
                    {this.drawEventImage(data_list[index].type)}
                    <span className="content">
                        {data_list[index].message}
                    </span>
                    <span className="event_time">
                        {data_list[index].createDate}
                    </span>
                    {data_list[index].is_read?"":this.drawButton(data_list[index].id)}
                </div>
            );
        }
        return list_items;
    }

    render() {
        return(
            <div className={this.props.style}>
                {this.renderListData()}
                {this.props.children}
            </div>
        );
    }
}