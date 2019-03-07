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
  
  //Variables for Chart blocks and dimensions
  Chart: any;
  ChartHeight: number;
  ChartWidth: number;
  SearchBox: any;
  SearchInput: any;
  ProjectsWrapper: any;
  Menu: any;
  DrawArea: any;
  Calendar: any;
  CalendarHeight: number;
  CalendarWidth: number;
  DrawAreaSvg: any;
  DrawAreaSvgWidth: number;
  DrawAreaSvgHeight: number;

  //Variables for Chart helper data
  Months: Array<any> = [];
  DateBoundary: Array<any> = [];
  SubHeaderRanges: Array<any> = [];
  GlobalStartDate: string;
  GlobalEndDate: string;

  //Time scale
  x: any;

  constructor() { }

  ngOnInit() {
    //Initialize
    this.Chart = d3.select('.chart');
    this.ChartHeight = this.Chart[0][0].offsetHeight;
    this.ChartWidth = this.Chart[0][0].offsetWidth;
    this.DrawAreaSvgHeight = 500;
    //Change this DrawAreaSvgWidth according to Months length
    // this.DrawAreaSvgWidth = 1000;
    
    //Pre-process data
    this.GlobalEndDate = config.data[0].milestones[0].tasks[0].end_date;
    this.GlobalStartDate = config.data[0].milestones[0].tasks[0].start_date
    this.processMilestones(config.data);

    //Create Blocks and helper data
    this.createBlocks();
    this.Months = this.getMonths(this.GlobalStartDate, this.GlobalEndDate);
    this.DrawAreaSvgWidth = this.Months.length * 50;
    this.SubHeaderRanges = this.getMonthsRange();
    console.log(this.Months);
    this.DateBoundary.push(moment(this.Months[0], 'MMM YYYY').startOf('month').toDate());
    this.DateBoundary.push(moment(this.Months[this.Months.length - 1], 'MMM YYYY').endOf('month').toDate());

    // //Give 50 width to every month block
    // this.CalendarWidth = this.Months.length * 50;

    //Create time scale for x axis
    this.x = d3.time.scale()
      .domain(this.DateBoundary)
      .range([0,this.DrawAreaSvgWidth])

    this.createChart();

    this.appendProjects();
  }

  createBlocks() {
    this.Menu = this.Chart
      .append('div')
      .attr('class', 'menu');
    
    this.DrawArea = this.Chart
      .append('div')
      .attr('class', 'draw-area');
    
    this.DrawAreaSvgHeight =  this.DrawArea[0][0].offsetHeight;
    
    this.SearchBox = this.Menu
      .append('div')
      .attr('class', 'search-box');

    this.CalendarHeight = this.SearchBox[0][0].offsetHeight;
    
    //Projects-Wrapper will contain all the projects
    this.ProjectsWrapper = this.Menu
      .append('div')
      .attr('class', 'projects-wrapper');

    this.SearchInput = this.SearchBox
      .append('input')
      .attr('type','text')
      .attr('placeholder','Search Projects')
      .attr('id','search-input')
      .attr('class','search-input')
  }

  createChart() {
     //Draw Area Svg is where gantt chart rectangles will be drawn
    //Draw Area Svg will also contain calendar with dates at the top
    //Keeping calendar and rectangles in single svg will make it easily scrollable in x-axis
    this.DrawAreaSvg  = this.DrawArea
      .append('svg')
      .attr('width', this.DrawAreaSvgWidth)
      .attr('height', this.DrawAreaSvgHeight);
    
    this.Calendar = this.DrawAreaSvg
      .append('rect')
      .attr('x', this.x(new Date(this.DateBoundary[0])))
      .attr('width', Math.abs(this.x(new Date(this.DateBoundary[0])) - this.x(new Date(this.DateBoundary[1])) ) )
      .attr('height', this.CalendarHeight)
      .attr('class', 'calendar');

    this.DrawAreaSvg.append('g')
      .selectAll('.bar')
      .data(this.SubHeaderRanges)
      .enter()
      .append('text')
      .attr('x', d => {
        return this.x(new Date(d.start_date)) + 20
      })
      .attr('width', d => {
        return this.getWidth(d);
      })
      .attr('y', this.CalendarHeight / 2)
      .text(function(d) {
        return d.name.substring(0,3);
      })
      .attr('class', function(d) {
        return "dates Date-" + moment(d.start_date).format("MMYYYY")
    });
    
  }

  appendProjects() {
    config.data.forEach( (d,i) => {
      console.log(d);
      let Project = this.ProjectsWrapper
        .append('div')
        .attr('class', 'project');
      
      let Button = Project.append('button')
        .attr('class', 'dropdown-button');
      
      Button.append('i')
        .attr('class', 'fas fa-angle-down');

      let ProjectName = Project.append('p')
        .text(d.project.name)
        .attr('class','project-name')

      let ProjectPhase = Project.append('div')
        .attr('class', 'project-phase');

      ProjectPhase.append('p')
        .text(d.project.phase)
        .attr('class','project-phase-para')
    })
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
