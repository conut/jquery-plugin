(function($) {
	var body, tempDiv;
	//文本内容长度小于或者等于unSplitLength，则不需要进行采用二分法
	var unSplitLength = 30;

	/**
	 * 初始化在屏幕外，用于判断调整区域大小的div.
	 */
	var initAdjustArea = function() {
		if (!body) {
			body = $(document.body);
		}
		if (!tempDiv) {
			tempDiv = $("<div></div>");
			tempDiv.css({
				position : "absolute",  //绝对定位
				right : 30000  //放到屏幕外面，防止在调整内容的时候出现屏幕闪烁
			});
			body.append(tempDiv);
		}
		tempDiv.empty(); //清空原来的内容
	};
	
	/**
	 * 采用二分法截取文本，有利于性能
	 * @param contentText 填充的文本内容
	 */
	var branchSplit = function(contentText){
		var res = new Array(2);
		var length = contentText.length;
		var lastIndex = length > 0 ? length -1 : 0;
		if(unSplitLength >= length){
			res[0] = contentText.substring(0, lastIndex);
			res[1] = contentText.substring(lastIndex,length);
		}else{
			var halfLength = Math.ceil(length/2);
			res[0] = contentText.substring(0, halfLength);
			res[1] = contentText.substring(halfLength,length);
		}
		return res;
	}

	var splitArray;
	var splitContent = function(dom, container, targetHeight) {
		var domObject = $(dom);

		if (domObject.get(0).nodeType != 3) {
			//如果不是TEXT节点
			$(dom).remove(); //直接删除
			return;
		}
		var node = dom.get(0); //textNode的内容不能用jquery方式设置，必须使用dom.nodeValue
		var contentText = domObject.text();
		while (contentText.length > 0 && container.height() > targetHeight) {
			splitArray = branchSplit(contentText);
			contentText = splitArray[0];
			node.nodeValue = contentText; //textNode的内容不能用jquery方式设置，必须使用dom.nodeValue
		}
		
		var appendLeaveText = function(){
			//当容器高度小于或是等于目标高度时，将二分法取到的剩下的部分继续添加到容器后面
			while ( container.height() <= targetHeight){
				var leaveHalf = splitArray[1];//二分法取到的剩下的部分
				splitArray = branchSplit(leaveHalf);//将剩下的部分再次二分法
				contentText = contentText + splitArray[0];//将第一部分追加的容器后面
				node.nodeValue = contentText;
				if(splitArray[0].length ==1){//如果追加的文本是一个字符，就跳出循环
					break;
				}
			}
			
			//追加剩下的文本之后，容器高度大于目标高度，则说明追加的文本过长，则先去掉追加的文本，然后，在将这段文本再次采用二分法，进行截取，然后再追加文本，直到不能再追加
			if(container.height() > targetHeight){
				contentText = contentText.substring(0,contentText.length -splitArray[0].length);//移除追加的文本
				node.nodeValue = contentText;
				if(splitArray[0].length > 1){//如果追加的文本长度是等于1，则说明移除这个字符之后，容器填入的文本刚刚好，否则需要将追加的文本，再次截断
					splitArray[1] = splitArray[0];
					appendLeaveText();
				}
			}
		}
		
		if(contentText.length > 0 && splitArray && 
					splitArray[1] && splitArray[1].length > 1){
			appendLeaveText();
		}
		
		if (contentText.length == 0) {
			//没有内容，因为box排版导致内容溢出
			domObject.remove(); //移除当前DOM
		}
	};

	/**
	 * 按节点拆分.
	 * <p>
	 *
	 * </p>
	 * @param {node} dom
	 * @param {jqueryObject} conainer 结果容器，用于获取当前大小
	 * @param {number} targetHeight	目标大小
	 */
	var domSplit = function(dom, container, targetHeight) {
		var childs = dom.get(0).childNodes; //获得子节点内容(原始DOM对象）
		var childCount = childs.length; //获得子节点的个数
		if (container.height() > targetHeight) { //如果真实高度大于目标高度时，才做调整
			var lastNode = null;
			if (childCount == 0) {
				//如果没有子节点，那么做内容文字调整功能
				//alert($(dom).text());
				splitContent(dom, container, targetHeight); //拆分内容
			} else {
				while (childCount > 0 && container.height() > targetHeight) { //当高度大于目标高度时继续调整
					//从父节点中依次删除最后一个节点
					//直到高度小于目标高度为止（这说明，这个节点需要继续做内部调整）
					lastNode = $(childs[--childCount]);
					lastNode.remove(); //移除
				}
				if (lastNode != null) {
					//继续针对该节点做调整
					$(dom).append(lastNode);
					domSplit(lastNode, container, targetHeight);
				}
			}
		}
	};

	var getHeight = function(obj) {
		//TODO 判断IE和IE的版本
	};
	var parseCssNumber = function(obj, prop, defaultValue) {
		var value = obj.css(prop);
		value = value ? value : (defaultValue ? defaultValue : 1);
		return parseInt(value);
	};

	$.extend($.fn, {
		textVerticalOverflow : function(str) {
			//initAdjustArea(); //初始化调整区域
			return this.each(function() { //针对jquery选择出的每个对象进行调整
				var element = $(this), //获得当前对象
				targetHeight = element.height(), //调整后的目标大小
				tmpElement = element;
				tmpChilds = tmpElement.children(), //获得子元素数组
				childCount = tmpChilds.length; //获得子元素数组长度
				tmpElement.height("auto"); //设置克隆后的节点高度为自动
				splitArray = null;
				domSplit(tmpElement, tmpElement, targetHeight);
				//将调整后的对象高度设置为原始高度
				var newHeight = targetHeight;
				tmpElement.height(newHeight);
			});
		}
	});
})(jQuery);
