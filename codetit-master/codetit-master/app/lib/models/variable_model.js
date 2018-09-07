function VariableModel() {
    var _self = {};

    _self.getGarbageTypes = function() {
        return [
            [1, '散乱ごみ'],
            [2, '投棄粗大ごみ'],
            [3, '漂着粗大ごみ'],
        ];
    };

    _self.getGarbageTypeName = function(id) {
        return _getName(_self.getGarbageTypes(), id);
    };

    _self.getGarbageLevels = function() {
        return [
            [1, '1'],
            [2, '2'],
            [3, '3'],
            [4, '4'],
            [5, '5'],
        ];
    };
    _self.getGarbageLevelName = function(id) {
        return _getName(_self.getGarbageLevels(), id);
    };

    _self.getGarbageDensities = function() {
        return [
            [0, '0: 20Lゴミ袋 0袋'],
            [0.25, 'TT: 20Lゴミ袋 約1/16袋'],
            [0.5, 'T: 20Lゴミ袋 約1/8袋'],
            [1, '1: 20Lゴミ袋 約1/4袋'],
            [2, '2: 20Lゴミ袋 約1/2袋'],
            [3, '3: 20Lゴミ袋 約1袋'],
            [4, '4: 20Lゴミ袋 約2袋'],
            [5, '5: 20Lゴミ袋 約4袋'],
            [6, '6: 20Lゴミ袋 約8袋'],
            [7, '7: 20Lゴミ袋 約16袋'],
            [8, '8: 20Lゴミ袋 約32袋'],
            [9, '9: 20Lゴミ袋 約64袋'],
            [10, '10: 20Lゴミ袋 約128袋'],
        ];
    }
    _self.getGarbageDensityName = function(id) {
        return _getName(_self.getGarbageDensities(), id);
    }

    _self.getGarbageDensityShortName = function(id) {
        var str = _getName(_self.getGarbageDensities(), id);
        // ちょっと汚いけど、:で分割してその前を返却する
        if (str) {
            return str.split(':')[0];
        } else {
            return '';
        }
    }

    _self.getGarbageStates = function() {
        return [
            [1, '不法投棄'],
            [2, '漂着'],
        ];
    }
    _self.getGarbageStateName = function(id) {
        return _getName(_self.getGarbageStates(), id);
    }

    _self.getTimeThrownAways = function() {
        return [
            [1, '一ヶ月以内'],
            [2, '一年以内'],
            [3, 'それ以前'],
        ];
    }
    _self.getTimeThrownAwayName = function(id) {
        return _getName(_self.getTimeThrownAways(), id);
    }

    _self.getWhichRiverSides = function() {
        return [
            [1, '左岸'],
            [2, '右岸'],
            [3, '区別なし'],
        ];
    }
    _self.getWhichRiverSideName = function(id) {
        return _getName(_self.getWhichRiverSides(), id);
    }

    _self.getHasRemoveds = function() {
        return [
            [0, '未処理'],
            [1, '処理済'],
        ];
    }
    _self.getHasRemovedName = function(id) {
        return _getName(_self.getHasRemoveds(), id);
    }

    _self.getGarbageDangerds = function() {
        return [
            [1, '危険物有'],
            [2, '危険物無'],
        ];
    }
    _self.getGarbageDangerdName = function(id) {
        return _getName(_self.getGarbageDangerds(), id);
    }

    _self.getGarbageCategoryShortcuts = function() {
        // ・・・(´・ω・｀) ごめん。面倒になって他と形を合わせてないんだ・・・
        return {
            'E1': {
                title: 'ペットボトル',
                mdl_id: 3,
                sml_id: 12,
            },
            'E2': {
                title: '空き缶',
                mdl_id: 3,
                sml_id: 14,
            },
            'E3': {
                title: 'レジ袋',
                mdl_id: 4,
                sml_id: 20,
            },
            'E4': {
                title: '肥料袋',
                mdl_id: 5,
                sml_id: 22,
            },
            'E5': {
                title: 'トレイ',
                mdl_id: 13,
                sml_id: 58,
            },
            'E6': {
                title: 'その他',
                mdl_id: 14,
                sml_id: 77,
            },
        };
    };

    _self.getGarbageCategoryShortcutName = function(id) {
        return _self.getGarbageCategoryShortcuts[id]['title'];
    };

    //
    // PRIVATE
    //

    /**
     * 名称を取得する
     */
    function _getName(list, id) {
        if (!_.isArray(list)) {
            return '';
        }

        for (var i = 0; i < list.length; i++) {
            if (list[i][0] == id) {
                return list[i][1] || '';
            }
        };
        return '';
    }

    return _self;
}

exports.create = VariableModel;
