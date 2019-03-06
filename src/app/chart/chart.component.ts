import { Component, OnInit, ViewEncapsulation} from '@angular/core';
import * as d3 from "d3";
import * as moment from "moment";
import { config } from './data.js';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ChartComponent implements OnInit {
  
  Chart: any;
  ChartHeight: number;
  ChartWidth: number;
  SearchBox: any;
  SearchInput: any;
  ProjectsWrapper: any;
  Menu: any;
  DrawArea: any;
  Calendar: any;
  DrawAreaSvg: any;
  DrawAreaSvgWidth: number;
  DrawAreaSvgHeight: number;

  Months: Array<any>;
  DateBoundary: Array<any> = [];
  GlobalStartDate: string;
  GlobalEndDate: string;

  x: any;

  constructor() { }

  ngOnInit() {
    this.Chart = d3.select('.chart');
    this.ChartHeight = this.Chart[0][0].offsetHeight;
    this.ChartWidth = this.Chart[0][0].offsetWidth;
    this.DrawAreaSvgHeight = 500;
    this.DrawAreaSvgWidth = 1000;
    
    this.GlobalEndDate = config.data[0].milestones[0].tasks[0].end_date;
    this.GlobalStartDate = config.data[0].milestones[0].tasks[0].start_date
    this.processMilestones(config.data);

    this.createBlocks();
    this.Months = this.getMonthsOfTheYear(this.GlobalStartDate, this.GlobalEndDate);
    console.log(this.Months);

    this.DateBoundary.push(moment(this.Months[0], 'MMM YYYY').startOf('month').toDate());
    this.DateBoundary.push(moment(this.Months[this.Months.length - 1], 'MMM YYYY').endOf('month').toDate());

    this.x = d3.time.scale()
      .domain(this.DateBoundary)
      .range([0, this.ChartWidth])
  }

  createBlocks() {
    this.Menu = this.Chart
      .append('div')
      .attr('class', 'menu');
    
    this.DrawArea = this.Chart
      .append('div')
      .attr('class', 'draw-area');
    
    this.SearchBox = this.Menu
      .append('div')
      .attr('class', 'search-box');
    
    this.ProjectsWrapper = this.Menu
      .append('div')
      .attr('class', 'projects-wrapper');

    this.SearchInput = this.SearchBox
      .append('input')
      .attr('type','text')
      .attr('placeholder','Search Projects')
      .attr('id','search-input')
      .attr('class','search-input')

    this.DrawAreaSvg  = this.DrawArea
      .append('svg')
      .attr('width', this.DrawAreaSvgWidth)
      .attr('height', this.DrawAreaSvgHeight);
  }



  getMonthsOfTheYear(startDate: string, endDate: string) {
    let start = moment(startDate);
    const end = moment(endDate);
    let months = [];

    while(start.isBefore(end)) {
        months.push(start.format('MMM YYYY'));
        start.add(1, 'month');
    }
    return months;
  }
  
  processMilestones(data) {

    data.forEach( (project, projectIndex) => {

        project.milestones.forEach( (milestone, milestoneIndex) => {
            let startDate = milestone.tasks[0].start_date;
            let endDate = milestone.tasks[0].end_date;
            let tasksCompleted = startDate;

            for(let i=1; i<milestone.tasks.length; i++) {
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
