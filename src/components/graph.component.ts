import {Component, ElementRef, EventEmitter, Output, DoCheck} from "@angular/core";

declare var d3: any;

@Component({
  selector: 'graph',
  template: `<ng-content></ng-content>`
})
export class GraphComponent implements DoCheck {

  @Output() rootChange = new EventEmitter();
  @Output() showDetails = new EventEmitter();

  private host;
  private htmlElement;
  private svg;
  private dimensions;
  private nodesContainer;
  private linksContainer;
  private newRoot: string;
  private rootHasChanged: boolean;
  private rootDetails: boolean;
  private zoom;
  private zoomContainer;
  private prevContainer;
  private defaultTransform;
  private layout;

  // Improvements :
  // Use new fx and fy properties for fixed previous nodes
  // Add transitions and improve use of D3 data binding (enter and exit apis)

  constructor(private element: ElementRef) {
    this.htmlElement = this.element.nativeElement;
    this.host = d3.select(this.element.nativeElement);
    this.layout = {
      unitX: 70,
      unitY: 80,
      unitIcon: 30,
      unitImg: 28,
      linkDistance: 75,
      nodeScaleX: 1.15,
      nodeScaleY: 1.1,
      rootScaleX: 1.5,
      rootScaleY: 1.8,
      titleSize: 12,
      textSize: 10,
      padding: 3,
      seedsLength: 30,
      descLength: 50,
      periphNodesCount: 9
    };
  }

  ngAfterViewInit() {
    this.svg = this.host.append("svg")
      .attr("width", window.innerWidth)
      .attr("height", '100%');
    this.prevContainer = this.svg.append("g");
    this.zoomContainer = this.svg.append("g");
    this.zoom = d3.zoom().scaleExtent([0.6, 1.5]);
    let xBefore = 0, yBefore = 0;
    this.svg.call(this.zoom.on("zoom", () => {
      this.zoomContainer.attr("transform", d3.event.transform);
      let prevLine = this.prevContainer.select("line");
      if(prevLine.size() > 0) {
        let x2 = prevLine.attr("x2");
        let y2 = prevLine.attr("y2");

        let xTransform =  d3.event.transform.x / d3.event.transform.k;
        let yTransform = d3.event.transform.y / d3.event.transform.k;

        prevLine.attr("x2", (+x2 + xTransform - xBefore)).attr("y2", (+y2 + yTransform - yBefore));
        xBefore = xTransform;
        yBefore = yTransform;
      }
    })).on("dblclick.zoom", null)
      .on("mousedown.zoom", null);

    let defs = this.zoomContainer.append("defs");
    defs.append("font-face")
      .attr("font-family", "Ionicons")
      .append("font-face-src")
      .append("font-face-uri")
      .attr("xlink:href", "assets/fonts/ionicons.svg#Ionicons");

    // seeds drop shadow
    let shadowFilter = defs.append("filter").attr("id", "shadow");
    shadowFilter.append("feOffset").attr("result", "offOut").attr("in", "SourceAlpha").attr("dx", "0").attr("dy", "1");
    shadowFilter.append("feGaussianBlur").attr("result", "blurOut").attr("in", "offOut").attr("stdDeviation", "0.7");
    shadowFilter.append("feBlend").attr("in", "SourceGraphic").attr("in2", "blurOut").attr("mode", "normal");

    // seed hexagonal shape
    defs.append("path").attr("id", "seed").attr("d", "M70,56.19V22.77a6.06,6.06,0,0,0-3-5.24L38,.82A6,6,0,0,0,32,.82L3,17.53a6.06,6.06,0,0,0-3,5.24V56.21a6.06,6.06,0,0,0,3,5.24L32,78.16a6,6,0,0,0,6.06,0L67,61.46A6.14,6.14,0,0,0,70,56.19Z");

    // icons
    let actionIcon = defs.append("symbol").attr("id", "action").attr("viewBox", "0 0 30 30");
    actionIcon.append("path").attr("d", "M23.47,19.25s0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0l0,0,0,0s0,0,0,0l0,0,0,0h0L12.66,8.29a.71.71,0,0,0-.51-.21.69.69,0,0,0-.51.21L8.4,11.53a.72.72,0,0,0,0,1L19,23.16h0l0,0,0,0,0,0h0l0,0h0l0,0h.13l4.19.94.16,0a.71.71,0,0,0,.51-.21.7.7,0,0,0,.19-.68ZM12.16,9.82l9.58,9.58-2.22,2.22L9.94,12ZM21,22.23l1.39-1.39.4,1.79Z");
    actionIcon.append("path").attr("d", "M6.94,11.11a.71.71,0,0,0,1,0,.72.72,0,0,0,0-1l-.65-.65a.89.89,0,0,1,0-1.26l1-1A.88.88,0,0,1,8.9,7a.86.86,0,0,1,.62.26l.65.65a.73.73,0,0,0,1-1l-.65-.65a2.32,2.32,0,0,0-3.3,0l-1,1a2.35,2.35,0,0,0,0,3.31Z");
    actionIcon.append("path").attr("d", "M13.66,20.21l-3.36,3.36L6.46,19.74,7.22,19l.84.84a.71.71,0,0,0,1,0,.72.72,0,0,0,0-1L8.23,18,9,17.19l.84.84a.71.71,0,0,0,1,0,.72.72,0,0,0,0-1L10,16.16l0,0a.73.73,0,0,0-1-1L4.89,19.23a.71.71,0,0,0-.21.51.69.69,0,0,0,.21.51l4.86,4.86a.71.71,0,0,0,1,0l3.87-3.87a.72.72,0,0,0,0-1A.67.67,0,0,0,13.66,20.21Z");
    actionIcon.append("path").attr("d", "M25.13,9.76,20.27,4.89a.71.71,0,0,0-.51-.21.69.69,0,0,0-.51.21l-4,4a.72.72,0,0,0,0,1,.73.73,0,0,0,1,0l.84.84a.71.71,0,0,0,1,0,.72.72,0,0,0,0-1L17.2,9,18,8.22l.84.84a.73.73,0,0,0,.51.21.71.71,0,0,0,.51-.21.72.72,0,0,0,0-1L19,7.2l.76-.76,3.84,3.84L20,13.81a.72.72,0,0,0,0,1,.71.71,0,0,0,1,0l4-4a.76.76,0,0,0,0-1Z");

    let ideaIcon = defs.append("symbol").attr("id", "idea").attr("viewBox", "0 0 30 30");
    ideaIcon.append("path").attr("d", "M11.33,19.52a.63.63,0,0,1-.34-.1,7.91,7.91,0,1,1,8,0,.68.68,0,1,1-.69-1.16,6.56,6.56,0,1,0-6.65,0,.68.68,0,0,1-.34,1.26Z");
    ideaIcon.append("path").attr("d", "M16.56,25.31H13.45a.68.68,0,1,1,0-1.36h3.12a.68.68,0,1,1,0,1.36Z");
    ideaIcon.append("path").attr("d", "M17.23,23.29H12.77a.68.68,0,1,1,0-1.36h4.47a.68.68,0,0,1,0,1.36Z");
    ideaIcon.append("path").attr("d", "M17.23,21.27H12.77a.68.68,0,1,1,0-1.36h4.47a.68.68,0,0,1,0,1.36Z");
    ideaIcon.append("path").attr("d", "M14.11,18.7a.66.66,0,0,1-.47-.2.67.67,0,0,1,0-1l1.63-1.64H13.1a.67.67,0,0,1-.63-.43.69.69,0,0,1,.17-.74l3.12-2.89a.68.68,0,0,1,.92,1l-1.86,1.72h2.08a.67.67,0,0,1,.47,1.15L14.58,18.5A.62.62,0,0,1,14.11,18.7Z");

    let eventIcon = defs.append("symbol").attr("id", "event").attr("viewBox", "0 0 30 30");
    eventIcon.append("path").attr("d", "M25.29,10.6,20.82,6.13a1.63,1.63,0,0,0-2.31,0l-1,1a1.61,1.61,0,0,0-.16,2.24l4.84,4.82-2,2-5.43-5.43a.54.54,0,0,0-.41-.18l-2.85-.25h-.05a.68.68,0,0,0-.64.54L10.6,12a1.15,1.15,0,0,1-1.13.93.74.74,0,0,1-.25,0,1.21,1.21,0,0,1-.73-.49,1.11,1.11,0,0,1-.17-.88l.08-.44a4,4,0,0,1,2-2.79A2.13,2.13,0,0,1,12,8.07l3.24.57a.63.63,0,0,0,.49-.11A.6.6,0,0,0,16,8.1a.65.65,0,0,0-.52-.74L12.35,6.8a4.6,4.6,0,0,0-.83-.08,4.24,4.24,0,0,0-4.16,3.41l-.28,1.13a2.41,2.41,0,0,0,.35,1.84,2.37,2.37,0,0,0,1.58,1,2.68,2.68,0,0,0,.47.05,2.45,2.45,0,0,0,2.4-2l.1-.56,2,.19,0,0,6.75,6.75a.38.38,0,0,1,0,.54.42.42,0,0,1-.3.11.32.32,0,0,1-.25-.11l-2.79-2.81a.7.7,0,0,0-.91,0,.65.65,0,0,0-.18.47.68.68,0,0,0,.19.48l2.8,2.8a.38.38,0,0,1,.12.27.37.37,0,0,1-.12.27.46.46,0,0,1-.3.11.32.32,0,0,1-.25-.11L16,17.85a.7.7,0,0,0-.91,0,.65.65,0,0,0-.18.47.68.68,0,0,0,.19.48l2.8,2.8a.36.36,0,0,1,0,.54.39.39,0,0,1-.54,0l-2.83-2.8a.7.7,0,0,0-.91,0,.65.65,0,0,0-.18.47.68.68,0,0,0,.19.48l2.8,2.8a.36.36,0,0,1,0,.54.39.39,0,0,1-.54,0L4.6,12.39a.65.65,0,0,0-.46-.17h0a.59.59,0,0,0-.63.63.68.68,0,0,0,.19.48L6.32,16l-.69.69a1.48,1.48,0,0,0,0,2.14l.25.25a1.52,1.52,0,0,0,.74.41h.05v.05a1.52,1.52,0,0,0,.41.74l.25.25a1.52,1.52,0,0,0,.74.41h.05V21a1.52,1.52,0,0,0,.41.74l.25.25a1.52,1.52,0,0,0,.74.41h.05v.05a1.52,1.52,0,0,0,.41.74l.25.25a1.49,1.49,0,0,0,1.07.45,1.54,1.54,0,0,0,1.07-.45l.69-.69,1.78,1.78A1.71,1.71,0,0,0,16,25a1.59,1.59,0,0,0,1.19-.5,1.69,1.69,0,0,0,.47-.91v-.06h.06a1.47,1.47,0,0,0,.9-.47,1.72,1.72,0,0,0,.47-.91v-.06h.06a1.47,1.47,0,0,0,.9-.47,1.59,1.59,0,0,0,.47-.91v-.06h.06a1.47,1.47,0,0,0,.9-.47,1.73,1.73,0,0,0,0-2.4L21,17.16,25.16,13A1.66,1.66,0,0,0,25.29,10.6ZM7.12,18.07a.24.24,0,0,1-.16.07H7a.15.15,0,0,1-.12-.07l-.24-.24a.24.24,0,0,1-.07-.17.19.19,0,0,1,.07-.14l.62-.62.54.54Zm1.46,1.48a.24.24,0,0,1-.16.07h0a.15.15,0,0,1-.12-.07L8,19.3A.2.2,0,0,1,8,19.15.22.22,0,0,1,8,19l.62-.62.54.57ZM10.05,21a.24.24,0,0,1-.16.07h0A.15.15,0,0,1,9.75,21l-.24-.24a.2.2,0,0,1-.07-.16.19.19,0,0,1,.07-.16l.62-.62.54.57Zm1.49,1.48a.25.25,0,0,1-.17.06.21.21,0,0,1-.15-.06L11,22.25a.24.24,0,0,1-.07-.18.15.15,0,0,1,.07-.12l.62-.62.56.54ZM24.39,12v0l-1.29,1.29L18.35,8.61a.29.29,0,0,1-.09-.24.44.44,0,0,1,.08-.23L19.4,7.08A.29.29,0,0,1,19.64,7a.44.44,0,0,1,.23.08l4.51,4.5a.22.22,0,0,1,.1.2A.58.58,0,0,1,24.39,12Z");

    let organizationIcon = defs.append("symbol").attr("id", "organization").attr("viewBox", "0 0 30 30");
    organizationIcon.append("path").attr("d", "M18.87,16.05c2.45,0,4.44-2.45,4.44-5.47A5.07,5.07,0,0,0,22,7a4.39,4.39,0,0,0-6.3,0,5.1,5.1,0,0,0-1.28,3.56C14.43,13.6,16.42,16.05,18.87,16.05ZM16.17,8.79a6.52,6.52,0,0,0,4.31,2.58h.07a.68.68,0,0,0,.69-.63.69.69,0,0,0-.63-.76,5.1,5.1,0,0,1-3.54-2.35,2.9,2.9,0,0,1,1.8-.58c1.83,0,3.06,1.41,3.06,3.51,0,2.25-1.37,4.09-3.06,4.09s-3.06-1.83-3.06-4.08A4.35,4.35,0,0,1,16.17,8.79Z");
    organizationIcon.append("path").attr("d", "M26.32,20.72a6.6,6.6,0,0,0-3.49-4.53,2.33,2.33,0,0,0-1-.19,2.63,2.63,0,0,0-1.92,1,1.43,1.43,0,0,1-1,.59h0A1.79,1.79,0,0,1,17.74,17a2.38,2.38,0,0,0-2.84-.8,6.29,6.29,0,0,0-3.62,4.54,8.86,8.86,0,0,0-.19,3,.69.69,0,0,0,.69.61l14.17,0h0a.69.69,0,0,0,.69-.65A9,9,0,0,0,26.32,20.72ZM12.45,22.91c0-1.28.27-4.25,3-5.46a1,1,0,0,1,1.19.39l0,0a3.11,3.11,0,0,0,2.18,1.06A2.74,2.74,0,0,0,21,17.87a1.09,1.09,0,0,1,1.27-.43A5.19,5.19,0,0,1,25,21a9.45,9.45,0,0,1,.28,1.91Z");
    organizationIcon.append("path").attr("d", "M9.71,16c2,0,3.66-2,3.66-4.49a4.15,4.15,0,0,0-1.06-2.93,3.63,3.63,0,0,0-5.21,0A4.15,4.15,0,0,0,6,11.48C6,14,7.68,16,9.71,16ZM12,11.48c0,1.71-1,3.1-2.28,3.1s-2.28-1.39-2.28-3.1a3.32,3.32,0,0,1,.18-1.13,3.8,3.8,0,0,0,2.93,1.54h.13l-.06-.69-.05-.69A2.49,2.49,0,0,1,8.49,9.21a2.15,2.15,0,0,1,1.23-.35C11.08,8.84,12,9.9,12,11.48Z");
    organizationIcon.append("path").attr("d", "M9.16,21,4.74,21A4,4,0,0,1,7,17.16a.84.84,0,0,1,.91.2,2.67,2.67,0,0,0,1.86.9,2.28,2.28,0,0,0,1.76-.9.69.69,0,0,0-1-.91,1,1,0,0,1-.71.42h0a1.25,1.25,0,0,1-.81-.42,2.22,2.22,0,0,0-2.46-.59h0a5.48,5.48,0,0,0-3,5.89.7.7,0,0,0,.68.59l5.06,0h0a.7.7,0,0,0,0-1.39Z");

    let personIcon = defs.append("symbol").attr("id", "person").attr("viewBox", "0 0 30 30");
    personIcon.append("path").attr("d", "M15,17.64c3,0,5.52-3.07,5.52-6.84a6.36,6.36,0,0,0-1.6-4.45,5.47,5.47,0,0,0-7.84,0,6.36,6.36,0,0,0-1.6,4.45C9.45,14.57,11.92,17.64,15,17.64ZM11.5,8.21a8.75,8.75,0,0,0,6,3.45h.06a.73.73,0,0,0,.06-1.46A7.29,7.29,0,0,1,12.48,7,3.85,3.85,0,0,1,15,6.15C17.39,6.15,19,8,19,10.8c0,3-1.82,5.37-4.06,5.37s-4.06-2.41-4.06-5.37A5.71,5.71,0,0,1,11.5,8.21Z");
    personIcon.append("path").attr("d", "M25.37,24.46c0-.19-.8-4.82-5.11-6.58h0a3.81,3.81,0,0,0-3.55.73h0a2.67,2.67,0,0,1-3.46,0,3.64,3.64,0,0,0-3.43-.76c-4.26,1.08-5.14,6.36-5.17,6.58A.73.73,0,0,0,4.8,25a.74.74,0,0,0,.56.26l19.3,0h0a.74.74,0,0,0,.56-.26A.69.69,0,0,0,25.37,24.46Zm-19.1-.65c.4-1.36,1.45-3.94,3.9-4.55h0a2.17,2.17,0,0,1,2,.44l0,0a4.17,4.17,0,0,0,5.35,0,2.38,2.38,0,0,1,2.12-.48,7.3,7.3,0,0,1,4,4.6Z");

    let projectIcon = defs.append("symbol").attr("id", "project").attr("viewBox", "0 0 30 30");
    projectIcon.append("path").attr("d", "M24.27,22.64H5.73a.76.76,0,1,0,0,1.51H24.27a.76.76,0,1,0,0-1.51Z");
    projectIcon.append("path").attr("d", "M8.7,22.14a.75.75,0,0,0,.94-.5l.54-1.76H18a.76.76,0,0,0,0-1.51H10.64l.8-2.63h5a.76.76,0,0,0,0-1.51H11.89l.8-2.63h2.66a.76.76,0,0,0,0-1.51h-2.2L14,7.36h2l4.35,14.26a.76.76,0,0,0,1.45-.44L17.29,6.39a.75.75,0,0,0-.72-.54H13.42a.76.76,0,0,0-.72.54L8.21,21.2A.76.76,0,0,0,8.7,22.14Z");

    let creativeWorkIcon = defs.append("symbol").attr("id", "creativeWork").attr("viewBox", "0 0 30 30");
    creativeWorkIcon.append("path").attr("d", "M24.65,8.85a.74.74,0,0,0-.74.74V21.15a12.61,12.61,0,0,0-6.39-.08l.36-.17a12.65,12.65,0,0,1,4.65-1.11.74.74,0,0,0,.74-.74V6.77a.75.75,0,0,0-.21-.53A.72.72,0,0,0,22.55,6c-1,0-4.35.12-6.66,1.67a.74.74,0,0,0,.82,1.22A10.78,10.78,0,0,1,21.8,7.52V18.34a14.82,14.82,0,0,0-4.51,1.2,9.26,9.26,0,0,0-1.86,1.06V11h0c0-1.17-.54-2.79-3.11-3.92A14.21,14.21,0,0,0,6.85,6a.71.71,0,0,0-.52.21.73.73,0,0,0-.21.53v1.8a15.09,15.09,0,0,0-1.57.31A.73.73,0,0,0,4,9.59V22.14a.75.75,0,0,0,.31.6.74.74,0,0,0,.67.1,10.88,10.88,0,0,1,9.29.78l.09.05h0a0,0,0,0,1,0,0h0l.05,0h0l.06,0h.38s0,0,0,0H15l0,0a0,0,0,0,0,0,0h0l.06,0a0,0,0,0,0,0,0,11,11,0,0,1,9.29-.79.74.74,0,0,0,.67-.1.75.75,0,0,0,.31-.6V9.59A.73.73,0,0,0,24.65,8.85ZM14,11v9.63a9.81,9.81,0,0,0-1.86-1.06,15.14,15.14,0,0,0-4.51-1.2V7.52C10.32,7.67,14,8.66,14,11ZM5.49,21.15v-11l.63-.12v9a.74.74,0,0,0,.74.74,12.65,12.65,0,0,1,4.65,1.11l.36.17A12.61,12.61,0,0,0,5.49,21.15Z");

    let competenceIcon = defs.append("symbol").attr("id", "competence").attr("viewBox", "0 0 30 30");
    competenceIcon.append("path").attr("d", "M27.38,10.84,15.12,6.48a.74.74,0,0,0-.47,0l-12,4.33a.7.7,0,0,0,0,1.31l12,4.94a.77.77,0,0,0,.27.05.82.82,0,0,0,.27-.05l8-3.21V17.6a2.7,2.7,0,0,0,2.69,2.69.71.71,0,1,0,0-1.41,1.29,1.29,0,0,1-1.29-1.29V13.27l2.84-1.14a.71.71,0,0,0,.44-.67A.69.69,0,0,0,27.38,10.84ZM14.89,15.65,4.8,11.5,14.89,7.89l10.27,3.65Z");
    competenceIcon.append("path").attr("d", "M21.58,15.14a.71.71,0,0,0-.71.71V20.2l-2.44,1.17a7.94,7.94,0,0,1-6.88,0L9.12,20.2V15.84a.71.71,0,0,0-1.41,0v4.8a.71.71,0,0,0,.4.63l2.84,1.36a9.33,9.33,0,0,0,8.09,0l2.84-1.36a.69.69,0,0,0,.4-.63v-4.8A.69.69,0,0,0,21.58,15.14Z");

    let productIcon = defs.append("symbol").attr("id", "product").attr("viewBox", "0 0 30 30");
    productIcon.append("path").attr("d", "M24.21,8.91,21.14,6.55a.7.7,0,0,0-.41-.14H17.31a.68.68,0,0,0,0,1.36H20.5l2.2,1.68-2.2,1.68H8.56V7.76H15a.68.68,0,0,0,.68-.68V4.72a.68.68,0,1,0-1.36,0V6.4H7.89a.68.68,0,0,0-.68.68v4.73a.68.68,0,0,0,.68.68h6.42V13.7h-5a.7.7,0,0,0-.41.14L5.78,16.2a.66.66,0,0,0,0,1.06l3.07,2.36a.7.7,0,0,0,.41.14h3.42a.68.68,0,1,0,0-1.36H9.49L7.3,16.72,9.49,15H21.43v3.38H15a.68.68,0,0,0-.68.68v6.19a.68.68,0,1,0,1.36,0V19.77h6.46a.68.68,0,0,0,.68-.68V14.37a.68.68,0,0,0-.68-.68H15.65V12.47h5.08a.7.7,0,0,0,.41-.14L24.22,10a.67.67,0,0,0,.27-.53A.68.68,0,0,0,24.21,8.91Z");

    this.linksContainer = this.zoomContainer.append("g").attr("class", "links");
    this.nodesContainer = this.zoomContainer.append("g").attr("class", "nodes");

    this.defaultTransform = d3.zoomTransform(this.zoomContainer);
  }

  ngDoCheck(): void {
    if(this.linksContainer && this.nodesContainer) {
      if(this.rootHasChanged) {
        this.rootChange.emit({newRoot: this.newRoot});
        this.rootHasChanged = false;
      } else if(this.rootDetails) {
        this.showDetails.emit();
        this.rootDetails = false;
      }
    }
  }

  drawNetwork(networkData): void {
    let that = this;
    let layout = this.layout;
    let nodes = networkNodes(networkData.nodes, networkData.previousNode);
    let edges = networkEdges(networkData.edges, networkData.previousNode);

    this.dimensions = {
      width: this.svg.node().getBoundingClientRect().width,
      height: this.svg.node().getBoundingClientRect().height
    };

    // Debug log
    // console.log('drawNetwork with ' + nodes.length + ' nodes and ' + edges.length + ' edges');

    // Check that DOM is ready and data is consistent
    if(this.svg && this.nodesContainer && this.linksContainer && (nodes.length == edges.length + 1)) {
      this.linksContainer.selectAll("*").remove();
      this.nodesContainer.selectAll("*").remove();

      let simulation = d3.forceSimulation()
        .alphaMin(0.2)
        .force("link", d3.forceLink().id(function (d) {
          return d.id;
        })
        .distance(function (link, index) {
          return (index < layout.periphNodesCount ? layout.linkDistance  : (layout.linkDistance * 2)) * layout.nodeScaleX;
        }))
        .force("charge", d3.forceManyBody().strength(function (node, index) {
          return node.isRoot ? (nodes.length == 2 ? -20000 : -1200) : -800;
        }))
        .force("center", d3.forceCenter(this.dimensions.width / 2, this.dimensions.height / 2));

      let linksData = this.linksContainer
        .selectAll("line")
        .data(edges);

      let linkEnter = linksData
        .enter().append("line");

      let nodesData = this.nodesContainer
        .selectAll("g")
        .data(nodes);

      let nodesEnter = nodesData.enter().append("g");

      nodesEnter.append("use")
        .attr("transform", function (d) {
          return d.isRoot ? "scale(" + layout.rootScaleX + " " + layout.rootScaleY + ")" : "scale(" + layout.nodeScaleX + " " + layout.nodeScaleY + ")";
        })
        .attr("filter", function (d) {
          return d.category == 'concept' ? "url(#shadow)" : "";
        })
        .attr("class", function (d) {
          return d.category + " bg_" + d.category;
        })
        .attr("xlink:href", "#seed");

      nodesEnter.append("use")
        .attr("transform", function (d) {
          return d.isRoot ? "scale(" + layout.rootScaleX + ")" : "scale(" + layout.nodeScaleX + ")";
        })
        .attr("x", (layout.unitX - layout.unitIcon) / 2)
        .attr("y", (layout.unitIcon / 2) - (layout.padding * 2))
        .attr("width", layout.unitIcon)
        .attr("height", layout.unitIcon)
        .attr("class", function (d) {
          return d.category + " icon";
        })
        .attr("xlink:href", function (d) {
          return d.picture ? '' : ('#' + d.category);
        });

      nodesEnter.append("image")
        .attr("transform", function (d) {
          return d.isRoot ? "scale(" + layout.rootScaleX + ")" : "scale(" + layout.nodeScaleX + ")";
        })
        .attr("class", "img-node")
        .attr("x", (layout.unitX - layout.unitImg) / 2)
        .attr("y", (layout.unitImg / 2) - (layout.padding * 2))
        .attr("width", layout.unitImg)
        .attr("height", layout.unitImg)
        .attr("xlink:href", function (d) {
          return d.picture;
        });

      nodesEnter.append("text")
        .attr("transform", function (d) {
          return d.isRoot ? "scale(" + layout.rootScaleX + ")" : "scale(" + layout.nodeScaleX + ")";
        })
        .attr("x", (layout.unitX - layout.titleSize) / 2 + layout.padding * 0.5)
        .attr("y", layout.padding)
        .attr("font-size", layout.titleSize)
        .attr("class", "icon")
        .text(function (d) {
          return d.scope == 'private' ? '\uf31d' : ''
        });

      let nodesLabel = nodesEnter.append("text")
        .attr("text-anchor", "middle")
        .attr("x", function (d) {
          return layout.unitX * (d.isRoot ? layout.rootScaleX : layout.nodeScaleX) / 2;
        })
        .attr("y", function (d) {
          return (layout.unitIcon * 1.5 - layout.padding * 2) * (d.noIcon() ? 0.75 : (d.isRoot ? layout.rootScaleX : layout.nodeScaleX)) + 2 * layout.padding;
        })
        .attr("class", function (d) {
          return d.category + " label";
        })
        .attr("dy", "1em")
        .text(function (d) {
          return d.isRoot ? (d.label + "|" + (d.description || '')) : d.label;
        });

      simulation.nodes(nodes).on("tick", () => {
        updateNodesAndLinks(linkEnter, nodesEnter);
      });
      simulation.force("link").links(edges);

      this.nodesContainer.selectAll("g").on("click", changeRootNode);
      this.zoomContainer.attr("transform", this.defaultTransform);

      if (networkData.previousNode) {
        this.drawPrevious(networkData.previousNode);
      }

      wrapLabels(nodesLabel, that);
    }

    function changeRootNode() {
      let clickedNode = d3.select(this);
      if(clickedNode.datum().isRoot) {
        that.rootDetails = true;
      } else {
        that.newRoot = clickedNode.datum().id;
        that.rootHasChanged = true;
      }
    }

    function wrapLabels(texts, ref) {
      texts.each(function() {
        let text = d3.select(this);
        if(text.text().indexOf("|") != -1) {
          let textTokens = text.text().split("|");
          ref.doWrap(text, textTokens[0], true, true, layout.titleSize, layout.padding * 2, layout);
          ref.doWrap(text, textTokens[1], false, true, layout.textSize, layout.titleSize + layout.padding, layout);
        } else {
          ref.doWrap(text, text.text(), true, false, layout.textSize, 0, layout);
        }
      });
    }

    function updateNodesAndLinks(links, nodes) {
      links
        .attr("x1", function (d) {
          let x = d.source.x;
          return parseFloat(x);
        })
        .attr("y1", function (d) {
          let y = d.source.y;
          return parseFloat(y);
        })
        .attr("x2", function (d) {
          return that.dimensions.width / 2;
        })
        .attr("y2", function (d) {
          return that.dimensions.height / 2;
        });

      nodes
        .attr("transform", function (d) {
          let tx, ty;
          if(d.isRoot) {
            tx = that.dimensions.width / 2 - (layout.unitX * layout.rootScaleX / 2);
            ty = that.dimensions.height / 2 - (layout.unitY * layout.rootScaleY / 2);
          } else {
            tx = d.x - (layout.unitX * layout.nodeScaleX / 2);
            ty = d.y - (layout.unitY * layout.nodeScaleY / 2);
          }
          return "translate(" + tx + "," + ty + ")";
        });
    }

    function networkEdges(edges, previous) {
      if(previous) {
        for(let i = 0; i < edges.length; i++) {
          if(edges[i].source == previous.id) {
            edges.splice(i, 1);
          }
        }
      }
      return edges;
    }

    function networkNodes(nodes, previous) {
      if(previous) {
        for(let i = 0; i < nodes.length; i++) {
          if(nodes[i].id == previous.id) {
            nodes.splice(i, 1);
          }
        }
      }
      return nodes;
    }
  }

  doWrap(textElt, val, reset, isRoot, fontSize, offset, layout) {
    let words = val.split(/\s+/).reverse(),
      word,
      line = [],
      lines = 1,
      x = Number.parseInt(textElt.attr("x")),
      charsCount = 0,
      textLength = ((textElt.datum() && textElt.datum().isRoot) ? layout.descLength : layout.seedsLength),
      width = layout.unitX * (isRoot ? layout.rootScaleX : layout.nodeScaleX) - 2 * layout.padding;
    if(reset) {
      textElt.text(null);
    }
    let tspan = textElt.append("tspan").attr("x", x).attr("dy", offset).attr("font-size", fontSize + "px");
    while ((word = words.pop()) && charsCount <= textLength) {
      charsCount += word.length + 1;
      if(charsCount > textLength) {
        word = word.substr(0, word.length - (charsCount - textLength)) + '…';
      }
      line.push(word);
      tspan.text(line.join(" "));
      if (line.length > 1 && tspan.node().getComputedTextLength() > (width - 2 * layout.padding)) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = textElt.append("tspan").attr("x", x).attr("dy", fontSize).attr("font-size", fontSize + "px")
          .text(word);
        lines++;
      }
    }
    return lines;
  }

  drawPrevious(previousNode): void {
    this.prevContainer.selectAll("*").remove();

    if(!previousNode.disconnected) {
      this.prevContainer.append("line")
        .attr("class", "previous")
        .attr("x1", this.layout.unitX / 2 + this.layout.padding * 2)
        .attr("y1", this.layout.unitY / 2 + this.layout.padding * 2)
        .attr("x2", this.dimensions.width / 2)
        .attr("y2", this.dimensions.height / 2);
    }

    let prevNode = this.prevContainer.append("g");
    prevNode.append("use")
      .attr("transform", "translate(" + this.layout.padding * 2 + ", " + this.layout.padding * 2 + ") scale(" + this.layout.nodeScaleX + " " + this.layout.nodeScaleY + ")")
      .attr("filter", previousNode.noIcon() ? "url(#shadow)" : "")
      .attr("class", previousNode.category + " bg_" + previousNode.category)
      .attr("xlink:href", "#seed");

    prevNode.append("use")
      .attr("transform", "scale(" + this.layout.nodeScaleX + " " + this.layout.nodeScaleY + ")")
      .attr("x", (this.layout.unitX - this.layout.unitIcon) / 2 + this.layout.padding * 2)
      .attr("y", (this.layout.unitIcon / 2) - this.layout.padding)
      .attr("width", this.layout.unitIcon)
      .attr("height", this.layout.unitIcon)
      .attr("class", previousNode.category + " icon")
      .attr("xlink:href", previousNode.picture ? '' : ('#' + previousNode.category));

    prevNode.append("image")
      .attr("transform", "scale(" + this.layout.nodeScaleX + " " + this.layout.nodeScaleY + ")")
      .attr("class", "img-node")
      .attr("x", (this.layout.unitX - this.layout.unitImg) / 2 + this.layout.padding * 2)
      .attr("y", (this.layout.unitImg / 2) - this.layout.padding)
      .attr("width", this.layout.unitImg)
      .attr("height", this.layout.unitImg)
      .attr("xlink:href", previousNode.picture);

    prevNode.append("text")
      .attr("transform", "scale(" + this.layout.nodeScaleX + " " + this.layout.nodeScaleY + ")")
      .attr("x", (this.layout.unitX - this.layout.titleSize) / 2 + this.layout.padding * 2.5)
      .attr("y", this.layout.padding * 4)
      .attr("font-size", this.layout.titleSize)
      .attr("class", "icon")
      .text(previousNode.scope == 'private' ? '\uf31d' : '');

    let prevText = prevNode.append("text");
    prevText.attr("text-anchor", "middle")
      .attr("transform", "scale(" + this.layout.nodeScaleX + " " + this.layout.nodeScaleY + ")")
      .attr("x", this.layout.unitX / 2 + this.layout.padding * 2)
      .attr("y", (this.layout.unitIcon * 1.5 - this.layout.padding) * (previousNode.noIcon() ? 0.75 : 1) + 2 * this.layout.padding)
      .attr("class", previousNode.category + " label")
      .attr("dy", "1em")
      .html(previousNode.label);

    this.doWrap(prevText, prevText.text(), true, false, this.layout.textSize, 0, this.layout);

    prevText.append("tspan")
      .attr("x", prevText.attr("x"))
      .attr("dy", this.layout.textSize + 2 * this.layout.padding)
      .attr("class", "icon")
      .text('\uf27d');

    prevNode.on("click", () => {
      this.newRoot = previousNode.id;
      this.rootHasChanged = true;
    });
  }
}

