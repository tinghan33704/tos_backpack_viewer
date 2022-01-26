const tool_id = 'backpack';

let theme = 'normal';
let playerData = {uid: '', card: [], info: {}}
let currentSeal = ''
let sealContentMonster = {}
let isReverseMode = false 	// 反向檢視
let isCompressMode = false	// 去除已有召喚獸檢視

$(document).ready(function() {
    init()
	
	$('.seal-row').html(renderSealTabs())
	
	currentSeal = Object.keys(sealContent)[0]
	
	Object.keys(sealContent).forEach((sealName, index) => {
		$(`#showSeal${index}`).on("click", (event) => selectSeal(index, event))
	})
	
	if(location.search) {
		$('.card-row').html(loadingPanel())
		readUserIdFromUrl()
	}
	else {
		$('#showSeal0').click()
		$('.uid-banner').html(playerData?.uid ? `<div>UID: ${playerData.uid}</div>` : '')
	}
    
    $("#reverse-btn").length && $('#reverse-btn').click(() => { 
        reverseMode();
    });
    
    $("#compress-btn").length && $('#compress-btn').click(() => { 
        compressMode();
    });
});

function reverseMode() {
	isReverseMode = !isReverseMode
	
	isReverseMode && $("#reverse-btn").addClass('reverseMode-activate')
	!isReverseMode && $("#reverse-btn").removeClass('reverseMode-activate')
	
	showSeal(currentSeal)
}

function compressMode() {
	isCompressMode = !isCompressMode
	
	isCompressMode && $("#compress-btn").html('<i class="fa fa-expand"></i>').addClass('reverseMode-activate')
	!isCompressMode && $("#compress-btn").html('<i class="fa fa-compress"></i>').removeClass('reverseMode-activate')
	
	showSeal(currentSeal)
}

function loadingPanel() {
	return `
		<div class="col-12 loadingPanel">載入資料中...</div>
	`
}

function renderSealTabs() {
	const tabCount = Object.keys(sealContent).length
	const tabLength = Math.trunc(12 / tabCount)
	const marginLength = (12 - tabLength * tabCount) / 2
	
	let str = ''
	if(marginLength > 0) str += `<div class='col-12 col-md-${marginLength} col-lg-${marginLength}'></div>`
	Object.keys(sealContent).forEach((sealName, index) => {
		str += `<div class='col-12 col-md-${tabLength} col-lg-${tabLength} seal-nav${index == 0 ? ' seal-nav-active' : ''}' id='showSeal${index}'>${sealName}</div>`
	})
	if(marginLength > 0) str += `<div class='col-12 col-md-${marginLength} col-lg-${marginLength}'></div>`
	
	return str
}

function selectSeal(index, event)
{
	const name = Object.keys(sealContent)[index]
	currentSeal = name
	
	if(!currentSeal.endsWith('自選')) {
		$("#reverse-btn").hide()
		isReverseMode = false
		$("#reverse-btn").removeClass('reverseMode-activate')
		
		$("#compress-btn").hide()
		isCompressMode = false
		$("#compress-btn").removeClass('reverseMode-activate')
	} else {
		$("#reverse-btn").show()
		$("#compress-btn").show()
	}
	
	$('.seal-nav').removeClass('seal-nav-active')
	$('#'+event.target.id).addClass('seal-nav-active')
	
	!playerData?.uid.length && $('#inventory-btn').click()
	showSeal(name)
}

function showSeal(name)
{
	let cardStr = ''
	const sealData = sealContent[name]
	
	const allCardTitle = [
		'給我看清楚了，這就是油的顏色',
		'無他，惟手油爾',
		'太油了吧',
		'瘋頭說：「再抽更多卡！」',
		'斗肉！萌死他咖斗！'
	]
	
	const mustGetTitle = '五選一必能選中'
	
	Object.keys(sealData).forEach(genre => {
		const hasCard = sealData[genre].every(monster => {
			return Array.isArray(monster) ? monster.some(id => playerData.card.includes(id)) : playerData.card.includes(monster)
		})
		
		const mustGet = [...Array(5).keys()].map(i => i+1).includes(sealData[genre].filter(monster => {
			return Array.isArray(monster) ? !monster.some(id => playerData.card.includes(id)) : !playerData.card.includes(monster)
		}).length) || sealData[genre].length <= 5
		
		allCardStr = allCardTitle[Math.floor(Math.random()*(allCardTitle.length))]
		
		let genreStr = genre
		if(name.includes('自選')) {
			const attr = attr_zh_to_en[genre.split(' ‧ ')[0].trim()[0]]
			const race = race_zh_to_en[genre.split(' ‧ ')[1].trim()]
			genreStr = `<img src='../tos_tool_data/img/monster/icon_${attr}.png' style='width: 1em'>&nbsp;<img src='../tos_tool_data/img/monster/icon_${race}.png' style='width: 1em'>&nbsp;${genre}`
		}
		
		if(!isCompressMode || !hasCard) {
			cardStr += '<div class="col-12 col-sm-6"><div class="row genre-row">'
			cardStr += `
				<div class='col-12 genre-name${(isReverseMode && mustGet) ? ' genre-name-mustGet' : (!isReverseMode && hasCard) ? ' genre-name-allCollected' : ''}' ${(isReverseMode && mustGet) ? `title=${mustGetTitle}` : (!isReverseMode && hasCard) ? `title=${allCardStr}` : ''}> ${genreStr}</div>
				${sealData[genre].map(id => {
					const sk_str = renderMonsterSeriesInfo(genre, Array.isArray(id) ? id : [id])
					return renderMonsterSeriesImage(genre, Array.isArray(id) ? id : [id], sk_str)
				}).join('')}
				<div class='col-12'><hr /></div>
			`
			cardStr += '</div></div>'
		}
	})
	
	$('.card-row').html(cardStr)
	
    $('[data-toggle=popover]').popover({
		container: 'body',
		html: true,
		sanitize: false,
		trigger: 'focus',
		placement: 'bottom',
    })
}

function openUidInputPanel()
{
    $('#uidPanel').modal('show');
    renderUidInputPanel();
}

function renderUidInputPanel()
{
    let render_str = "";
	render_str += `
	<div class='row uid-row'>
		<div class='col-6 col-md-6 col-lg-6 uid-nav uid-nav-active' id='loadInventoryNav' onclick='switchGetInventory("load")'>匯入背包</div>
		<div class='col-6 col-md-6 col-lg-6 uid-nav' id='updateInventoryNav' onclick='switchGetInventory("update")'>更新背包</div>
		<div class='col-12 my-2'></div>
		
		<div class='col-12 col-md-12 col-lg-12 uid-tab' id='loadInventoryTab' style='display: block;'>
			<div class='col-12 col-md-12 col-lg-12 btn-shell'>
				<input type='text' class='form-control uid-input' id='load-uid-input' placeholder='輸入 UID' maxlength=${uid_maxlength} onkeypress='return (event.charCode !=8 && event.charCode ==0 || (event.charCode >= 48 && event.charCode <= 57))'>
			</div>
			<div class='col-12 col-md-12 col-lg-12 btn-shell'>
				<div>
					<button class='btn btn-success btn-block uid-btn' id='load-confirm-uid' onclick='getPlayerInventory("load")'>
						確定
					</button>
				</div>
				<div>
					<button class='btn btn-success btn-block uid-btn' id='load-save-inventory' onclick='savePlayerInventory("load")'>
						儲存背包
					</button>
				</div>
			</div>
			<div class='col-12 col-md-12 col-lg-12 uid-status' id='load-uid-status'></div>
		</div>
		
		<div class='col-12 col-md-12 col-lg-12 uid-tab' id='updateInventoryTab' style='display: none;'>
			<div class='col-12 col-md-12 col-lg-12 btn-shell'>
				<input type='text' class='form-control uid-input' id='update-uid-input' placeholder='輸入 UID' maxlength=${uid_maxlength} onkeypress='return (event.charCode !=8 && event.charCode ==0 || (event.charCode >= 48 && event.charCode <= 57))'>
			</div>
			<div class='col-12 col-md-12 col-lg-12 btn-shell'>
				<input type='text' class='form-control uid-input' id='update-veri-input' placeholder='輸入驗證碼' maxlength=${veri_maxlength} onkeypress='return (event.charCode !=8 && event.charCode ==0 || (event.charCode >= 48 && event.charCode <= 57))'>
			</div>
			<div class='col-12 col-md-12 col-lg-12 btn-shell'>
				<div>
					<button class='btn btn-success btn-block uid-btn' id='update-confirm-uid' onclick='getPlayerInventory("update")'>
						確定
					</button>
				</div>
				<div>
					<button class='btn btn-success btn-block uid-btn' id='update-save-inventory' onclick='savePlayerInventory("update")'>
						儲存背包
					</button>
				</div>
			</div>
			<div class='col-12 col-md-12 col-lg-12 uid-status' id='update-uid-status'></div>
		</div>
	</div>
	`

    $("#uidPanel .modal-body").html(render_str)
	$('#load-confirm-uid').css({'display': 'block'})
	$('#load-save-inventory').css({'display': 'none'})
	$('#update-confirm-uid').css({'display': 'block'})
	$('#update-save-inventory').css({'display': 'none'})
}

function switchGetInventory(state)
{
	if(state === 'load') {
		$("#loadInventoryNav").addClass('uid-nav-active')
		$("#updateInventoryNav").removeClass('uid-nav-active')
		
		$("#loadInventoryTab").css({'display': 'block'})
		$("#updateInventoryTab").css({'display': 'none'})
	}
	else {
		$("#loadInventoryNav").removeClass('uid-nav-active')
		$("#updateInventoryNav").addClass('uid-nav-active')
		
		$("#loadInventoryTab").css({'display': 'none'})
		$("#updateInventoryTab").css({'display': 'block'})
	}
	
	$('#load-uid-input').val('')
	$('#update-uid-input').val('')
	$('#update-veri-input').val('')
	$('#load-confirm-uid').css({'display': 'block'})
	$('#load-save-inventory').css({'display': 'none'})
	$('#update-confirm-uid').css({'display': 'block'})
	$('#update-save-inventory').css({'display': 'none'})
	$('#load-uid-status').html('')
	$('#update-uid-status').html('')
	$('#load-uid-input').attr('disabled', false)
	$('#update-uid-input').attr('disabled', false)
}

function renderMonsterSeriesInfo(genreName, monsters) {
	return `
		<div class='row' style='padding: 0 4px;'>
			${monsters.map(id => {
				const monster = monster_data.find((element) => {
					return element.id === id
				})
				const monster_attr = !monster?.attribute?.length ? '' : monster?.attribute
				const notInInventory = isReverseMode ? playerData.card.includes(monster?.id) : !playerData.card.includes(monster?.id)
				return `
					<div class='result_monster_block'>
						<img class='tooltip_monster_img${notInInventory ? '_gray' : ''}' src='../tos_tool_data/img/monster/${monster?.id}.png' title='${monster?.name ?? ''}' onerror='monsterErrorImage(this, \`${monster_attr}\`)'></img>
						<div class='monsterId${notInInventory ? '_gray' : ''}'>
							<a href='https://tos.fandom.com/zh/wiki/${monster?.id}' target='_blank'>${monster?.id ? paddingZeros(monster.id, 3) : '???'}</a>
						</div>
						<div class='monsterCount${notInInventory ? '_gray' : ''}'>
							×${playerData?.info?.[id]?.number || 0}
						</div>
					</div>
				`
			}).join('')}
		</div>
	`
}

function renderMonsterSeriesImage(genreName, series, tooltip_content) {
	const finalStage = ['新世紀福音戰士石抽', 'ROCKMAN X DiVE', '假面騎士'].includes(genreName) ? series[0] : series[series.length - 1]
	const monster = monster_data.find(monster => monster.id === finalStage)
	const monster_attr = !monster?.attribute?.length ? '' : monster?.attribute
    const notInInventory = isReverseMode ? series.some(id => playerData.card.includes(id)) : !series.some(id => playerData.card.includes(id))
	const finalStageMonsterIdInInventory = [...series].reverse().find(id => playerData.card.includes(id) && playerData.info[id]?.number > 0)
	const monsterToDisplay = !isReverseMode && !notInInventory ? monster_data.find(monster => monster.id === finalStageMonsterIdInInventory) : monster
	const shouldShowImage = isCompressMode ? isReverseMode ? !notInInventory : notInInventory : true
	
    return shouldShowImage ? `
        <div class='col-4 col-md-3 col-lg-2 series_result'>
			<div class='image_shell' tabindex=${monsterToDisplay?.id?.toString().replace('?', '')} data-toggle='popover' data-title='' data-content="${tooltip_content}">
				${(!isReverseMode && !notInInventory) ? renderInfoTag(finalStageMonsterIdInInventory) : ``}
				<img class='monster_img${notInInventory ? '_gray' : ''}' src='../tos_tool_data/img/monster/${monsterToDisplay?.id}.png' onerror='monsterErrorImage(this, "${monster_attr}")'></img>
			</div>
        </div>
    ` : '';
}

function renderInfoTag(id) {
	const data = playerData?.info?.[id] || {}
	const refine_src = data?.enhanceLevel < 5 ? `../tos_tool_data/img/monster/refine_${data?.enhanceLevel}.png` : '../tos_tool_data/img/monster/recall.png'
	
	return `
		<div class='skill_level_tag'>
			SLv. ${data?.skillLevel || '???'}
		</div>
		<div class='bottom_tag ${ data?.enhanceLevel > 0 ? `bottom_tag_long` : `` }'>
			${ data?.enhanceLevel > 0 ?
				`<img src="${refine_src}" />` : ``
			}
			<div class='level_tag ${ data?.enhanceLevel > 0 ? `level_tag_short` : ``}'>
				${renderBottomTagContent(id)}
			</div>
		</div>
	`
}

function renderBottomTagContent(id) {
	const data = playerData?.info?.[id] || {}
	const level = data?.level || '???'
	const skillLevel = data?.skillLevel || 0
	const enhanceLevel = data?.enhanceLevel || 0
	
	const monster = monster_data.find(monster => monster.id === id)
	const maxLevel = monster?.maxLevel || 0
	const maxSkill = monster?.maxSkill || 0
	const maxRefine = monster?.maxRefine || 0
	
	if(level < maxLevel) return `Lv. ${level}`
	
	if(maxRefine > 0 && level >= maxLevel && skillLevel >= maxSkill && enhanceLevel >= maxRefine) return '<span class="all_max_tag">All Max</span>'
	if(level == maxLevel && skillLevel == maxSkill) return '<span class="dual_max_tag">Dual Max</span>'
	if(level == maxLevel) return '<span class="lv_max_tag">Lv. Max</span>'
	
	return 'Lv. ???'
}

function renderResult() {
	showSeal(currentSeal)
}

function monsterErrorImage(img, attr) {
	img.src = `../tos_tool_data/img/monster/noname${attr.length > 0 ? `_${attr_zh_to_en[attr]}` : ''}.png`
}

function readUserIdFromUrl() {
	const code_array = location.search.split("?")[1].split("&")[0].split("=")
	
	if(code_array[0] !== 'uid') {
		errorAlert(1)
		return
	}
	
	const uid = code_array[1]
	
	getPlayerInventory('load', uid)
}