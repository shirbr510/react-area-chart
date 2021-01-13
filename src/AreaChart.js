import React from "react";

class AreaChart extends React.Component {
  constructor(props) {
    super(props);

    this._svgRef = React.createRef();

    this._drawSvg = this._drawSvg.bind(this);
    this._bezierCommand = this._bezierCommand.bind(this);

    this._resizeObserver = new ResizeObserver(this._drawSvg);
  }
  render() {
    const { width } = this.props;
    return (
      <div>
        <svg
          ref={this._svgRef}
          version="1.1"
          height="60"
          width={width}
          xmlns="http://www.w3.org/2000/svg"
        />
      </div>
    );
  }

  componentDidMount() {
    this._drawSvg();
    const svgElement = this._svgRef.current;
    if (svgElement) {
      this._resizeObserver.observe(svgElement.parentNode);
    }
  }

  componentDidUpdate(prevProps) {
    const { points } = this.props;
    if (points !== prevProps.points) {
      this._drawSvg();
    }
  }

  componentWillUnmount() {
    this._resizeObserver.disconnect();
  }

  _getPercentage(value, max) {
    return (value / max) * 100;
  }

  _reversePercentage(value) {
    return Math.abs(100 - value);
  }

  /**
   * Properties of a line
   *  I:  - pointA (array) [x,y]: coordinates
   *      - pointB (array) [x,y]: coordinates
   *  O:  - (object) { length: l, angle: a }: properties of the line
   */
  _getLine(pointA, pointB) {
    const lengthX = pointB.x - pointA.x;
    const lengthY = pointB.y - pointA.y;

    return {
      length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
      angle: Math.atan2(lengthY, lengthX)
    };
  }

  /**
   * Position of a control point
   *  I:  - current (array) [x, y]: current point coordinates
   *      - previous (array) [x, y]: previous point coordinates
   *      - next (array) [x, y]: next point coordinates
   *      - reverse (boolean, optional): sets the direction
   *  O:  - (array) [x,y]: a tuple of coordinates
   */
  _getControlPoint(current, previous, next, reverse) {
    // When 'current' is the first or last point of the array
    // 'previous' or 'next' don't exist.
    // Replace with 'current'
    const p = previous || current;
    const n = next || current;

    // The smoothing ratio
    const smoothing = 0.2;

    // Properties of the opposed-line
    const o = this._getLine(p, n);

    // If is end-control-point, add PI to the angle to go backward
    const angle = o.angle + (reverse ? Math.PI : 0);
    const length = o.length * smoothing;

    // The control point position is relative to the current point
    const x = current.x + Math.cos(angle) * length;
    const y = current.y + Math.sin(angle) * length;

    return {
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100
    };
  }

  /**
   * Create the bezier curve command
   *  I:  - point (array) [x,y]: current point coordinates
   *      - i (integer): index of 'point' in the array 'a'
   *      - a (array): complete array of points coordinates
   *  O:  - (string) 'C x2,y2 x1,y1 x,y': SVG cubic bezier C command
   */
  _bezierCommand(point, i, a) {
    // start control point
    const { x: cpsX, y: cpsY } = this._getControlPoint(
      a[i - 1],
      a[i - 2],
      point
    );

    // end control point
    const { x: cpeX, y: cpeY } = this._getControlPoint(
      point,
      a[i - 1],
      a[i + 1],
      true
    );

    return `C ${cpsX},${cpsY} ${cpeX},${cpeY} ${point.x},${point.y}`;
  }

  /**
   *   Render the svg <path> element
   *  I:  - points (array): points coordinates
   *      - command (function)
   *      I:  - point (array) [x,y]: current point coordinates
   *          - i (integer): index of 'point' in the array 'a'
   *          - a (array): complete array of points coordinates
   *      O:  - (string) a svg path command
   *  O:  - (string): a Svg <path> element
   */
  _drawSvgPath(points, command) {
    // build the d attributes by looping over the points

    const d = points.reduce(
      (acc, point, i, a) =>
        i === 0
          ? // if first point
            `M ${point.x},${point.y}`
          : // else
            `${acc} ${command(point, i, a)}`,
      ""
    );

    return `
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0" y2="100%">
            <stop offset="0%"   stop-color="red"/>
            <stop offset="100%" stop-color="black"/>
          </linearGradient>
          <marker id="dot" viewBox="-5 -5 10 10" markerWidth="5" markerHeight="5" onHover="console.log">
            <circle r="5" fill="red" />
            <circle r="3" fill="black" />
          </marker>
        </defs>
        <path d="${d}" id="gradient" fill=url(#gradient) stroke="grey" marker-mid="url(#dot)"/>`;
  }

  _drawSvg() {
    const svgElement = this._svgRef.current;
    if (!svgElement) {
      return;
    }

    const widthMultiplyer = svgElement.clientWidth / 100;
    const heightMultiplyer = svgElement.clientHeight / 100;

    const { points } = this.props;
    const maxX = Math.max(...points.map((point) => point.x));
    const maxY = Math.max(...points.map((point) => point.y));

    let pointsToRender = [{ x: 0, y: 0 }, ...points, { x: 100, y: 0 }];
    pointsToRender = pointsToRender.map((point) => {
      const xPercent = this._getPercentage(point.x, maxX);
      const yPercent = this._getPercentage(point.y, maxY);
      return {
        x: xPercent * widthMultiplyer,
        y: this._reversePercentage(yPercent) * heightMultiplyer
      };
    });

    svgElement.innerHTML = this._drawSvgPath(
      pointsToRender,
      this._bezierCommand
    );
  }
}

export default AreaChart;
