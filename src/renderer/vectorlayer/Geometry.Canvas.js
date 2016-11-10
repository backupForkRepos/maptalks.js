//如果不支持canvas, 则不载入canvas的绘制逻辑
if (Z.Browser.canvas) {

    var ellipseReources = {
        _getPaintParams: function () {
            var map = this.getMap();
            var pcenter = this._getPrjCoordinates();
            var pt = map._prjToPoint(pcenter);
            var size = this._getRenderSize();
            return [pt, size['width'], size['height']];
        },

        _paintOn: Z.Canvas.ellipse
    };

    Z.Ellipse.include(ellipseReources);

    Z.Circle.include(ellipseReources);
    //----------------------------------------------------
    Z.Rectangle.include({
        _getPaintParams: function () {
            var map = this.getMap();
            var pt = map._prjToPoint(this._getPrjCoordinates());
            var size = this._getRenderSize();
            return [pt, size];
        },
        _paintOn: Z.Canvas.rectangle
    });
    //----------------------------------------------------
    Z.Sector.include({
        _getPaintParams: function () {
            var map = this.getMap();
            var pt = map._prjToPoint(this._getPrjCoordinates());
            var size = this._getRenderSize();
            return [pt, size['width'], [this.getStartAngle(), this.getEndAngle()]];
        },
        _paintOn: Z.Canvas.sector

    });
    //----------------------------------------------------

    Z.LineString.include({
        arrowStyles : {
            'classic' : [3, 4]
        },

        _getArrowPoints: function (prePoint, point, lineWidth, arrowStyle) {
            var width = lineWidth * arrowStyle[0],
                height = lineWidth * arrowStyle[1],
                hw = width / 2;

            var normal = point.substract(prePoint)._unit();
            var p1 = point.add(normal.multi(height));
            normal._perp();
            var p0 = point.add(normal.multi(hw));
            normal._multi(-1);
            var p2 = point.add(normal.multi(hw));
            return [p0, p1, p2, p0];
        },

        _arrow: function (ctx, prePoint, point, opacity, arrowStyle) {
            var style = this.arrowStyles[arrowStyle];
            if (!style) {
                return;
            }
            var lineWidth = this._getInternalSymbol()['lineWidth'];
            if (!lineWidth || lineWidth < 3) {
                lineWidth = 3;
            }

            var pts = this._getArrowPoints(prePoint, point, lineWidth, style);

            ctx.fillStyle = ctx.strokeStyle;

            Z.Canvas.polygon(ctx, pts, opacity, opacity);
        },

        _getPaintParams: function () {
            var prjVertexes = this._getPrjCoordinates();
            var points = this._getPath2DPoints(prjVertexes);
            return [points];
        },

        _paintOn:function (ctx, points, lineOpacity, fillOpacity, dasharray) {
            Z.Canvas.path(ctx, points, lineOpacity, null, dasharray);
            this._paintArrow(ctx, points, lineOpacity, this.options['arrowPlacement']);
        },

        _paintArrow: function (ctx, points, lineOpacity, placement) {
            if (ctx.setLineDash) {
                //remove line dash effect if any
                ctx.setLineDash([]);
            }
            if (this.options['arrowStyle'] && points.length >= 2) {
                if (placement === 'vertex-first' || placement === 'vertex-firstlast') {
                    this._arrow(ctx, points[1], points[0], lineOpacity, this.options['arrowStyle']);
                }
                if (placement === 'vertex-last' || placement === 'vertex-firstlast') {
                    this._arrow(ctx, points[points.length - 2], points[points.length - 1], lineOpacity, this.options['arrowStyle']);
                }
                if (placement === 'point') {
                    for (var i = 0, len = points.length - 1; i < len; i++) {
                        this._arrow(ctx, points[i], points[i + 1], lineOpacity, this.options['arrowStyle']);
                    }
                }
            }
        }
    });

    Z.Polygon.include({
        _getPaintParams: function () {
            var prjVertexes = this._getPrjCoordinates(),
                points = this._getPath2DPoints(prjVertexes),
                //splitted by anti-meridian
                isSplitted = points.length > 0 && Z.Util.isArray(points[0]);
            if (isSplitted) {
                points = [[points[0]], [points[1]]];
            }
            var prjHoles = this._getPrjHoles();
            var holePoints = [];
            if (Z.Util.isArrayHasData(prjHoles)) {
                var hole;
                for (var i = 0; i < prjHoles.length; i++) {
                    hole = this._getPath2DPoints(prjHoles[i]);
                    if (isSplitted) {
                        if (Z.Util.isArray(hole)) {
                            points[0].push(hole[0]);
                            points[1].push(hole[1]);
                        } else {
                            points[0].push(hole);
                        }
                    } else {
                        holePoints.push(hole);
                    }

                }
            }
            return [isSplitted ? points : [points].concat(holePoints)];
        },
        _paintOn: Z.Canvas.polygon
    });
}
