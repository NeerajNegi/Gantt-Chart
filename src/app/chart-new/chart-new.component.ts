import { Component, OnInit } from '@angular/core';
import * as d3 from "d3";
import * as moment from "moment";
import { config } from './data.js';

@Component({
  selector: 'app-chart-new',
  templateUrl: './chart-new.component.html',
  styleUrls: ['./chart-new.component.css']
})
export class ChartNewComponent implements OnInit {

  //Variables for Chart blocks and dimensions
  Chart: any;
  ChartHeight: number;
  ChartWidth: number;
  SearchBox: any;
  SearchInput: any;
  ProjectsWrapper: any;
  DrawArea: any;
  Calendar: any;
  CalendarHeight: number;
  CalendarWidth: number;
  DrawAreaSvg: any;
  DrawAreaSvgWidth: number;
  DrawAreaSvgHeight: number;
  Header: any;  

  //Variables for Chart helper data
  Months: Array<any> = [];
  DateBoundary: Array<any> = [];
  SubHeaderRanges: Array<any> = [];
  GlobalStartDate: string;
  GlobalEndDate: string;
  ViewportHeight: number;
  CurrentDay: any;

  //Time scale
  x: any;

  constructor() { }

  ngOnInit() {
    this.CurrentDay = {
      start_date: moment().startOf('day').toDate(),
      end_date: moment().endOf('day').toDate(),
    }

    this.Chart = d3.select('.chart');
    this.ChartHeight = this.Chart[0][0].offsetHeight;
    this.ChartWidth = this.Chart[0][0].offsetWidth;

    //Pre-process data
    this.GlobalEndDate = config.data[0].milestones[0].tasks[0].end_date;
    this.GlobalStartDate = config.data[0].milestones[0].tasks[0].start_date
    this.processMilestones(config.data);


    //Generate Helper data for Chart
    this.Months = this.getMonths(this.GlobalStartDate, this.GlobalEndDate);
    this.DrawAreaSvgWidth = this.Months.length * 50;
    this.SubHeaderRanges = this.getMonthsRange();
    this.DateBoundary.push(moment(this.Months[0], 'MMM YYYY').startOf('month').toDate());
    this.DateBoundary.push(moment(this.Months[this.Months.length - 1], 'MMM YYYY').endOf('month').toDate());

    //Create time scale for x axis
    this.x = d3.time.scale()
      .domain(this.DateBoundary)
      .range([0,this.DrawAreaSvgWidth])

    this.createBlocks();
  }


  createBlocks() {
    this.Header = this.Chart
      .append('div')
      .attr('class', 'header');
    
    this.SearchBox = this.Header
      .append('div')
      .attr('class', 'search-box');
    
    this.SearchInput = this.SearchBox
      .append('input')
      .attr('type','text')
      .attr('placeholder','Search Projects')
      .attr('id','search-input')
      .attr('class','search-input')
  }

  //Returns months between given date ranges
  getMonths(startDate: string, endDate: string) {
    let start = moment(startDate);
    const end = moment(endDate);
    let months = [];

    while(start.isBefore(end)) {
        months.push(start.format('MMM YYYY'));
        start.add(1, 'month');
    }
    return months;
  }

  getWidth(node) {
    let width;
      if (this.endsAfter(node)) {
          width = Math.abs(this.x(new Date(this.DateBoundary[1])) - this.x(new Date(node.start_date)));
      } else if (this.startsBefore(node)) {
          width = Math.abs(this.x(new Date(this.DateBoundary[0])) - this.x(new Date(node.end_date)));
      } else {
          width = this.getActualWidth(node);
      }
      return width;
  }

  getActualWidth(node) {
    return Math.abs(this.x(new Date(node.end_date)) - this.x(new Date(node.start_date)));
  }

  startsBefore(node) {
    return moment(node.start_date, "MM/DD/YYYY").isBefore(this.DateBoundary[0])
  }

  endsAfter(node) {
    return moment(node.end_date, "MM/DD/YYYY").isAfter(this.DateBoundary[1]);
  }

  getMonthsRange() {
      const ranges = [];
      this.Months.map(function(month) {
          let startOfMonth = moment(month, 'MMM YYYY').startOf('month')
          let endOfMonth = moment(month, 'MMM YYYY').endOf('month')
          ranges.push({
              name: moment(startOfMonth).format('MMMM'),
              start_date: startOfMonth.toDate(),
              end_date: endOfMonth.clone().add(1, 'd').toDate(),
          });

      });
      return ranges;
  }

  //Procss Data to get Global start and end dates
  //Append necessary data to milestone object itself
  processMilestones(data) {

    data.forEach( (project, projectIndex) => {

        project.milestones.forEach( (milestone, milestoneIndex) => {
            let startDate = milestone.tasks[0].start_date;
            let endDate = milestone.tasks[0].end_date;
            let tasksCompleted = startDate;

            for(let i=0; i<milestone.tasks.length; i++) {
                const mStartDate = new Date(milestone.tasks[i].start_date);
                const mEndDate = new Date(milestone.tasks[i].end_date);
                const currentStartDate = new Date(startDate);
                const currentEndDate = new Date(endDate);
                
                if(new Date(this.GlobalStartDate) > mStartDate) {
                    this.GlobalStartDate = milestone.tasks[i].start_date 
                }
                if(new Date(this.GlobalEndDate) < mEndDate) {
                    this.GlobalEndDate = milestone.tasks[i].end_date;
                }
                if(mStartDate < currentStartDate) {
                    startDate = milestone.tasks[i].start_date;
                }
                if(mEndDate > currentEndDate) {
                    endDate = milestone.tasks[i].end_date;
                }
                if(milestone.tasks[i].isCompleted === true) {
                    tasksCompleted = milestone.tasks[i].end_date;
                }
            }

            milestone['start_date'] = startDate;
            milestone['end_date'] = endDate;
            milestone['finishedTasksDate'] = tasksCompleted;

        })

    })
  }

}
