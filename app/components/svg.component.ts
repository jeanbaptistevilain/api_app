import {Component, ElementRef, Input, OnChanges, EventEmitter, Output, DoCheck, forwardRef} from "@angular/core";
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
  private previousRoot : string;
  private zoom;
  private zoomContainer;

  constructor(private element: ElementRef) {
    this.htmlElement = this.element.nativeElement;
    this.host = d3.select(this.element.nativeElement);
  }

  ngAfterViewInit() {

    this.zoom = d3.zoom();

    this.svg = this.host.append("svg")
      .attr("width", window.innerWidth)
      .attr("height", '100%');

    this.zoomContainer = this.svg.append("g");
    this.svg.call(this.zoom.on("zoom", () => {
      this.zoomContainer.attr("transform", d3.event.transform);
    }));

    this.zoomContainer.append("defs")
      .append("font-face")
      .attr("font-family", "Ionicons")
      .append("font-face-src")
      .append("font-face-uri")
      .attr("xlink:href", "ionicons.svg#Ionicons");

    this.linksContainer = this.zoomContainer.append("g")
      .attr("class", "links");
    this.nodesContainer = this.zoomContainer.append("g")
      .attr("class", "nodes");

    this.drawGraph();
  }

  ngOnChanges(): void {
    if(this.svg && this.nodesContainer && this.linksContainer) {
      this.drawGraph();
      this.zoom.scaleTo(this.zoomContainer, 1);
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
    var labelSize = 12, nodeRadius = 40;

    let simulation = d3.forceSimulation()
      .alphaMin(0.1)
      .force("link", d3.forceLink().id(function (d) { return d.id; }).distance(function (link, index) { return computeDistance(index); }))
      .force("charge", d3.forceManyBody().strength(function() { return -500; }))
      .force("center", d3.forceCenter(window.innerWidth / 2, (window.innerHeight - 49) / 2));

    let linkData = this.linksContainer
      .selectAll("line")
      .data(this.networkData.edges);

    let linkEnter = linkData
      .enter().append("line")
      .attr("stroke-width", 2);

    let textData = this.nodesContainer
      .selectAll("text")
      .data(this.networkData.nodes);

    let textEnter = textData.enter();

    let nodesImg = textEnter.append("image")
      .attr("class", function(d) {return d.picture ? (d.isRoot ? "root img-node" : "img-node") : '';})
      .attr("xlink:href", function(d) {return d.picture || '';});

    let nodesBg = textEnter.append("text")
      .attr("class", function(d) { return "icon icon-bg " + d.category + (d.isRoot ? " root" : ""); })
      .attr("text-anchor", "middle")
      .text(function(d) {return d.picture ? "\uf1f6" : "\uf1f7";});

    let nodesText = textEnter.append("text")
      .attr("class", function(d) {return "icon" + (d.isRoot ? " root" : "");})
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .text(function (d) { return d.picture ? '' : d.code; });

    let nodesLabel = textEnter.append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", labelSize + "px")
      .html(function (d) {
        var maxLength = nodeRadius * 2 / labelSize;
        if(d.label.length > maxLength) {
          let tspans = '',
            words = d.label.split(/\s+/),
            currentLine = [],
            firstLine = true;
          for(let i = 0; i < words.length; i++) {
            currentLine.push(words[i]);
            if(currentLine.join(' ').length > maxLength || i == words.length - 1) {
              tspans += '<tspan dy="' + (firstLine ? 0 : 1) + 'em">' + currentLine.join(' ') + '</tspan>';
              currentLine = [];
              firstLine = false;
            }
          }
          return tspans;
        } else {
          return d.label;
        }
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

    function computeDistance(index) {
      if(index < 8) {
        return nodeRadius + 30;
      } else if(index < 20) {
        return 2 * nodeRadius + 30;
      } else {
        return 3 * nodeRadius + 30;
      }
    }

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

      nodesImg
        .attr("x", function (d) {
          return d.isRoot ? (d.x - 44) : (d.x - 36);
        })
        .attr("y", function (d) {
          return d.isRoot ? (d.y - 80) : (d.y - 64);
        });

      nodesLabel
        .attr("x", function (d) {
          d3.select(this).selectAll("tspan").attr("x", d.x);
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
          return d.isRoot ? (parseFloat(d.y) - 17) : (parseFloat(d.y) - 14);
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

