import { Component, OnInit, ViewEncapsulation} from '@angular/core';
import * as d3 from "d3";
import * as moment from "moment";
// import * as $ from 'jquery';
// import * as f from 'floating-scroll';
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
  CurrentDay: any;
  Svg: any;
  BarsWrapper: any;

  //Variables for Chart helper data
  Months: Array<any> = [];
  DateBoundary: Array<any> = [];
  SubHeaderRanges: Array<any> = [];
  GlobalStartDate: string;
  GlobalEndDate: string;
  ViewportHeight: number;

  //Time scale
  x: any;

  constructor() { }

  ngOnInit() {
    //Initialize
    this.ViewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    console.log(this.ViewportHeight);
    this.CurrentDay = {
      start_date: moment().startOf('day').toDate(),
      end_date: moment().endOf('day').toDate(),
    }
    this.Chart = d3.select('.chart');
    this.ChartHeight = this.Chart[0][0].offsetHeight;
    this.ChartWidth = this.Chart[0][0].offsetWidth;
    this.DrawAreaSvgHeight = 500;
    
    //Pre-process data
    this.GlobalEndDate = config.data[0].milestones[0].tasks[0].end_date;
    this.GlobalStartDate = config.data[0].milestones[0].tasks[0].start_date
    this.processMilestones(config.data);
    console.log(config.data);
    //Create Blocks
    this.createBlocks();

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

    this.createChart();

    this.appendProjects();

    //Current day line
    const currentDayLine = this.Svg.append('line')
      // .attr('x1', this.x(new Date(this.CurrentDay.start_date)))
      // .attr('x2', this.x(new Date(this.CurrentDay.start_date)))
      .attr('x1', 5)
      .attr('x2', 5)
      .attr('y1', 0)
      .attr('y2', this.DrawAreaSvgHeight)
      .attr('class', 'current-day-line')
    
    //Current day circle
    const currentDayCircle = this.Svg.append('circle')
      // .attr('cx', this.x(new Date(this.CurrentDay.start_date)))
      .attr('cx', 5)
      .attr('cy', 2)
      .attr('r', '5px')
      .attr('class', 'current-day-circle');

    // $(document).ready(function(){
    //   console.log('hello from jquery');
    //   $(".draw-area").floatingScroll();
    // });
  }

  createBlocks() {
    this.Menu = this.Chart
      .append('div')
      .attr('class', 'menu');
    
    this.DrawArea = this.Chart
      .append('div')
      .attr('class', 'draw-area')
      .style('height', this.Chart[0][0].offsetHeight);
    
    this.SearchBox = this.Menu
      .append('div')
      .attr('class', 'search-box');

    this.CalendarHeight = this.SearchBox[0][0].offsetHeight;
    this.DrawAreaSvgHeight =  this.CalendarHeight + (config.data.length * (6.77*((1/100)*this.ViewportHeight)));
    
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
    this.DrawAreaSvg  = this.DrawArea.append('div')
      .attr('class', 'calendar')
      .append('svg')
      .attr('width', this.DrawAreaSvgWidth)
      .attr('height', this.CalendarHeight);
    
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
    
    this.BarsWrapper = this.DrawArea.append('div')
      .attr('class', 'bars-wrapper');

    //Calendar SVG
    this.Svg = this.DrawArea.append('svg')
      .attr('width', 10)
      .attr('height', this.DrawAreaSvgHeight)
      .style('position','absolute')
      .style('left', this.x(new Date(this.CurrentDay.start_date))-5)
      .style('top', this.CalendarHeight)
      .attr('id', 'draw-svg')

    //append border line for calendar
    // this.Svg.append('line')
    //   .attr('stroke', '#E8EFFD')
    //   .attr('x1', this.x(new Date(this.DateBoundary[0])))
    //   .attr('y1', 0)
    //   .attr('x2', this.x(new Date(this.DateBoundary[1])))
    //   .attr('y2', 0)
    //   .attr('id','drawarealine');

  }

  appendProjects() {
    config.data.forEach( (d,i) => {
      let index = i;
      let Project = this.ProjectsWrapper
        .append('div')
        .attr('class', 'project');
      
      let Button = Project.append('button')
        .attr('class', 'dropdown-button')
        .attr('id', 'project-' + d.project.id);
      
      Button.append('i')
        .attr('class', 'fas fa-angle-down');

      let ProjectName = Project.append('p')
        .text(d.project.name)
        .attr('class','project-name')

      let ProjectPhase = Project.append('div')
        .attr('class', 'project-phase');

      ProjectPhase.append('p')
        .text(d.project.phase)
        .attr('class','project-phase-para');
      
      let tasksWrapper = Project.append('div')
        .attr('class', 'tasks-wrapper')
        .attr('id', 'tasks-wrapper-' + d.project.id);

      let das = this.DrawAreaSvg;
      let x = this.x;
      let ch = this.CalendarHeight

      Button.on('click', function() {        
        if(!d.project.isOpen) {          
          d3.selectAll('.task').remove();
          d3.selectAll('.tasks-bars-wrapper')
            .style('display', 'none');
          config.data.forEach((d) => {
            if(d.project.isOpen)
              d.project.isOpen = false;
          })
          d.project.isOpen = true;
          d.milestones.forEach( (m, i) => {
            m['tasks'].forEach((t, i) => {
              let task = tasksWrapper.append('div')
                .attr('class', 'task')
                .attr('id', 'task-' + d.project.id);
              
              task.append('input')
                .attr('type', 'checkbox')
                .property('checked', function() {
                  if(t.isCompleted) {
                    return true
                  } else {
                    return false;
                  }
                })
                .attr('id', 'tast-checkbox')
                .attr('class', 'task-checkbox')
                .on('change', function() {
                  // console.log(t.name + ' is checked');
                  t.isCompleted = !t.isCompleted;
                })

              task.append('p')
                .text(t.name);
              
              // const projectHeight = 1/100 * this.ViewportHeight * 6.77;
              // das.append('rect')
              //   .attr('x', x(new Date(m.start_date)))
              //   .attr('y', (projectHeight*index) + ch + 10)
              //   .attr("width", Math.abs(x(new Date(m.end_date)) - x(new Date(m.start_date))) )
              //   .attr("height", "2vh")
              //   .attr('class', 'tasks ')
              
            })
          })
          console.log(d3.select('#tasks-bars-wrapper-' + project.project.id));
          d3.select('#tasks-bars-wrapper-' + project.project.id)
            .style('display', 'block');

        } else {
          d.project.isOpen = false;
          d3.selectAll('.task').remove();
          d3.selectAll('.tasks-bars-wrapper')
            .style('display', 'none');
        }
      });
      let project = d;
      
      let projectBarsWrapper = this.BarsWrapper.append('div')
        .attr('class', 'project-bars-wrapper')
        .attr('id', 'project-bars-wrapper' + project.project.id);

      let projectMilestoneWrapper = projectBarsWrapper.append('div')
        .attr('class', 'milestones-bars-wrapper')
        .attr('id', 'milestones-bars-wrapper-' + project.project.id);
      
      let projectTaskWrapper = projectBarsWrapper.append('div')
        .attr('class', 'tasks-bars-wrapper')
        .attr('id', 'tasks-bars-wrapper-' + project.project.id)

      d.milestones.forEach( (d, i) => {
        this.appendMilestoneBars(d, index, project, projectMilestoneWrapper);
        d.tasks.forEach((t, i) => {
          this.appendTasks(t, index, project, projectTaskWrapper);
        })
      })

      // d3.selectAll('.milestones')
      //   .on('click', function() {
      //     console.log(this);
      //   })
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

  appendMilestoneBars(d, index, project, wrapper) {
    const projectHeight = 1/100 * this.ViewportHeight * 6.77;
    //use this to round corners  '   .attr('rx', '5px')   '
    if(new Date(d.finishedTasksDate).getTime() === new Date(d.end_date).getTime() ) {
        wrapper.append('div')
          .attr('class', 'milestones')
          .attr('id', 'm1')
          .style('left', this.x(new Date(d.start_date)) + 'px')
          .style('width',  this.x(new Date(d.end_date)) - this.x(new Date(d.start_date)) + 'px')
          .on('click', function() {
            console.log(d);
          })
    } else if( new Date(d.finishedTasksDate).getTime() < new Date(d.end_date).getTime() ) {
      if( new Date(d.finishedTasksDate).getTime() > new Date().getTime()) {
        wrapper.append('div')
          .attr('class', 'milestones')
          .attr('id', 'm2')
          .style('left', this.x(new Date(d.start_date)) + 'px')
          .style('width',  this.x(new Date(d.finishedTasksDate)) - this.x(new Date(d.start_date)) + 'px')
        wrapper.append('div')
          .attr('class', 'milestones pending ')
          .attr('id', 'm3')
          .style('left', this.x(new Date(d.finishedTasksDate))  + 'px')
          .style('width',  this.x(new Date(d.end_date)) - this.x(new Date(d.finishedTasksDate)) + 'px')
      } else {
        wrapper.append('div')
          .attr('class', 'milestones')
          .attr('id', 'm4')
          .style('left', this.x(new Date(d.start_date))  + 'px')
          .style('width',  this.x(new Date(d.finishedTasksDate)) - this.x(new Date(d.start_date)) + 'px')
        wrapper.append('div')
          .attr('class', 'milestones late ')
          .attr('id', 'm5')
          .style('left', this.x(new Date(d.finishedTasksDate))  + 'px')
          .style('width',  this.x(new Date(d.end_date)) - this.x(new Date(d.finishedTasksDate)) + 'px')
      }
    } else if(new Date(d.finishedTasksDate).getTime() === new Date(d.start_date).getTime()) {
        wrapper.append('div')
          .attr('class', 'milestones not-started')
          .attr('id', 'm6')
          .style('left', this.x(new Date(d.start_date)) + 'px')
          .style('width',  this.x(new Date(d.finishedTasksDate)) - this.x(new Date(d.start_date)) + 'px')
    }
  }

  appendTasks(t, index, project, wrapper) {
    // console.log(this.x(new Date(t.start_date)));
    // console.log(t.start_date);
    let taskClass = '';
    let w = wrapper.append('div')
      .attr('class', 'task-wrapper');
    if(t.isCompleted) {
      taskClass = 'task-bar';
    } else if( new Date(t.end_date).getTime() > new Date().getTime()) {
      taskClass = 'task-bar not-started';
    } else if(new Date(t.end_date).getTime() < new Date().getTime()) {
      taskClass = 'task-bar late';
    }
    w.append('div')
        .attr('class', taskClass)
        .style('left' , this.x(new Date(t.start_date)) + 'px')
        .style('width', this.x(new Date(t.end_date)) - this.x(new Date(t.start_date)) + 'px')
        .on('click', () => {
          console.log('task', t);
          console.log('project', project);
        });
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