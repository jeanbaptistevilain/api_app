import {Component, ElementRef, Input, OnChanges, EventEmitter, Output, DoCheck} from "@angular/core";
import {NetworkContext} from "../models/network.context";

declare var d3: any;

@Component({
  selector: 'network-svg',
  template: `<ng-content></ng-content>`
})
export class SvgComponent implements DoCheck, OnChanges {

  @Input() networkData: any;
  @Input() networkContext: NetworkContext;
  @Output() rootChange = new EventEmitter();

  private host;
  private htmlElement;
  private svg;
  private nodesContainer;
  private linksContainer;
  private previousRoot : Array<any>;

  constructor(private element: ElementRef) {
    this.htmlElement = this.element.nativeElement;
    this.host = d3.select(this.element.nativeElement);
  }

  ngAfterViewInit() {
    this.svg = this.host.append("svg")
      .attr("width", window.innerWidth)
      .attr("height", '100%')
      .call(d3.zoom().on("zoom", zoomed));

    var zoomContainer = this.svg.append("g");

    zoomContainer.append("defs")
      .append("font-face")
      .attr("font-family", "Ionicons")
      .append("font-face-src")
      .append("font-face-uri")
      .attr("xlink:href", "ionicons.svg#Ionicons");

    this.linksContainer = zoomContainer.append("g")
      .attr("class", "links");
    this.nodesContainer = zoomContainer.append("g")
      .attr("class", "nodes");

    function zoomed() {
      zoomContainer.attr("transform", d3.event.transform);
    }
    this.drawGraph();
  }

  ngOnChanges(): void {
    if(this.svg && this.nodesContainer && this.linksContainer) {
      this.drawGraph();
    }
  }

  ngDoCheck(): void {
    if(this.linksContainer && this.nodesContainer && this.previousRoot && this.previousRoot !== this.networkContext.root) {
      this.linksContainer.selectAll("*").remove();
      this.nodesContainer.selectAll("*").remove();
      this.rootChange.emit({context: this.networkContext});
      this.previousRoot = this.networkContext.root;
    }
  }

  drawGraph(): void {
    let simulation = d3.forceSimulation()
      .alphaMin(0.1)
      .force("link", d3.forceLink().id(function (d) { return d.id; }).distance(function () { return 100; }))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(window.innerWidth / 2, (window.innerHeight - 49) / 2))
      .force("collision", d3.forceCollide(40));

    let linkData = this.linksContainer
      .selectAll("line")
      .data(this.networkData.edges);

    // linkData.exit().remove();

    let linkEnter = linkData
      .enter().append("line")
      .attr("stroke-width", function (d) { return 2; });

    let textData = this.nodesContainer
      .selectAll("text")
      .data(this.networkData.nodes);

    // textData.exit().remove();

    let textEnter = textData.enter();

    let nodesBg = textEnter.append("text")
      .attr("class", function(d) { return "icon " + d.category.toLowerCase(); })
      .attr("text-anchor", "middle")
      .attr("font-size", "80px")
      .attr("fill", "#ddd")
      .text("\uf1f7");

    let nodesText = textEnter.append("text")
      .attr("class", "icon")
      .attr("text-anchor", "middle")
      .attr("font-size", "42px")
      .attr("fill", "white")
      .text(function (d) { return d.code; });

    let nodesLabel = textEnter.append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(function (d) {
        console.log(JSON.stringify(d));
        return d.label;
      });

    this.nodesContainer
      .selectAll("text").call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

    this.nodesContainer
      .selectAll("text").on("click", changeRootNode);

    simulation.nodes(this.networkData.nodes)
      .on("tick", ticked);

    simulation.force("link")
      .links(this.networkData.edges);

    let that = this;

    function changeRootNode() {
      var newRoot = d3.select(this).datum().id;
      that.previousRoot = that.networkContext.root;
      that.networkContext.changeRoot(newRoot);
    }

    function ticked() {
      linkEnter
        .attr("x1", function (d) {
          return parseFloat(d.source.x);
        })
        .attr("y1", function (d) {
          return parseFloat(d.source.y) - 30;
        })
        .attr("x2", function (d) {
          return parseFloat(d.target.x);
        })
        .attr("y2", function (d) {
          return parseFloat(d.target.y) - 30;
        });

      nodesBg
        .attr("x", function (d) {
          return d.x;
        })
        .attr("y", function (d) {
          return d.y;
        });

      nodesLabel
        .attr("x", function (d) {
          return d.x;
        })
        .attr("y", function (d) {
          return parseFloat(d.y) + 12;
        });

      nodesText
        .attr("x", function (d) {
          return d.x;
        })
        .attr("y", function (d) {
          return parseFloat(d.y) - 14;
        });
    }

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }
}

