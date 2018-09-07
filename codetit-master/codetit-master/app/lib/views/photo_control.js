if (!OS_IOS) {
    // AndroidはImageFactoryを使わないと、リサイズなどでBMPになってしまう
    var ImageFactory = require('ti.imagefactory');
}

function PhotoControl(needCrop, maxSize) {
    var self = _.clone(Backbone.Events);
    var _needCrop = needCrop ? true : false;
    var _maxSize = maxSize || 800;

    /**
     * 撮影 OR 選択のオプションダイアログを表示
     */
    self.openSelectiveDialog = function(showDelete) {
        // 削除付きなら削除を候補に出す
        var dialog;
        if (OS_IOS) {
            // iOS
            if (showDelete) {
                dialog = Ti.UI.createOptionDialog({
                    options: ['撮影する', 'アルバムから選ぶ', '写真を削除する', 'キャンセル'],
                    cancel: 3,
                    destructive: 2
                });
            } else {
                dialog = Ti.UI.createOptionDialog({
                    options: ['撮影する', 'アルバムから選ぶ', 'キャンセル'],
                    cancel: 2
                });
            }
        } else {
            // Android
            if (showDelete) {
                dialog = Ti.UI.createOptionDialog({
                    options: ['撮影する', 'アルバムから選ぶ', '写真を削除する'],
                    buttonNames: ['キャンセル']
                });
            } else {
                dialog = Ti.UI.createOptionDialog({
                    options: ['撮影する', 'アルバムから選ぶ'],
                    buttonNames: ['キャンセル']
                });
            }
        }

        dialog.addEventListener('click', function(e) {
            if (OS_IOS) {
                // iOS
                switch (e.index) {
                case 0:
                    self.takePhoto();
                    break;
                case 1:
                    self.selectPhotoFromLibrary();
                    break;
                case 2:
                    if (showDelete) {
                        self.trigger('selectimage', {image: null});
                    }
                    break;
                default: // Do Nothing
                    break;
                }
            } else {
                // Android
                if (e.button === true) {
                    return;
                }

                switch (e.index) {
                case 0:
                    self.takePhoto();
                    break;
                case 1:
                    self.selectPhotoFromLibrary();
                    break;
                case 2:
                    if (showDelete) {
                        self.trigger('selectimage', {image: null});
                    }
                    break;
                default: // Do Nothing
                    break;
                }
            }
        });

        dialog.show();
    }

    /**
     * カメラを起動して写真を撮影する
     */
    self.takePhoto = function() {
        Ti.Media.showCamera({
            success: function(pgEvent) {
                adjustImageAndFireEvent(pgEvent.media);
            },
            error: function(error) {
                if (error.code === Ti.Media.NO_CAMERA) {
                    Alloy.Globals.UI.Alert.showAlert('', 'お使いの端末でカメラを認識できませんでした。アルバムからお選びください。', self.selectPhotoFromLibrary);
                } else {
                    Alloy.Globals.UI.Alert.showAlert('', 'カメラで異常が発生しました：' + error.error, self.selectPhotoFromLibrary);
                }
            },
            cancel: function() {},
            allowEditing: _needCrop,
            mediaTypes: [Ti.Media.MEDIA_TYPE_PHOTO],
            saveToPhotoGallery: true,
        });
    }

    /**
     * PhotoGalleryから写真を選択させる
     */
    self.selectPhotoFromLibrary = function() {
        Ti.Media.openPhotoGallery({
            success: function(pgEvent) {
                adjustImageAndFireEvent(pgEvent.media);
            },
            error: function(error) {
                Alloy.Globals.UI.Alert.showAlert('', 'PhotoGalleryからの写真選択に失敗しました：' + error.error);
            },
            allowEditing: _needCrop,
            mediaTypes: [Ti.Media.MEDIA_TYPE_PHOTO]
        });
    }

    //
    // PRIVATE
    //

    /**
     * 写真を調整してイベント発行
     * @param {Object} imageBlob
     */
    function adjustImageAndFireEvent(imageBlob) {
        Ti.API.debug('ORIGINAL IMAGE SIZE = ' + imageBlob.width + '/' + imageBlob.height);

        // リサイズ
        var isWidthLonger = imageBlob.width > imageBlob.height;
        if (isWidthLonger && imageBlob.width > _maxSize) {
            if (OS_IOS) {
                imageBlob = imageBlob.imageAsResized(
                    _maxSize, (imageBlob.height * (_maxSize / imageBlob.width)));
            } else {
                imageBlob = ImageFactory.imageAsResized(imageBlob,
                    { width: _maxSize, height: (imageBlob.height * (_maxSize / imageBlob.width)) });
            }
        } else if (!isWidthLonger && imageBlob.height > _maxSize) {
            if (OS_IOS) {
                imageBlob = imageBlob.imageAsResized(
                    (imageBlob.width * (_maxSize / imageBlob.height)),  _maxSize);
            } else {
                imageBlob = ImageFactory.imageAsResized(imageBlob,
                    { width: (imageBlob.width * (_maxSize / imageBlob.height)), height: _maxSize });
            }
        }
        Ti.API.debug('AFTER RESIZE IMAGE SIZE = ' + imageBlob.width + '/' + imageBlob.height);

        // 縦横比率が10%以上違う場合、強制的に真ん中でCROPする
        // ※iOSの場合はCROPされてるはずだけど、ちょっとよく分からないけどされてない場合もある
        if (_needCrop) {
            var acpectRatio = imageBlob.width / imageBlob.height;
            if (acpectRatio < 0.9 || 1.1 < acpectRatio) {
                if (isWidthLonger) {
                    if (OS_IOS) {
                        imageBlob = imageBlob.imageAsCropped({
                            width: imageBlob.height,
                            height: imageBlob.height
                        });
                    } else {
                        imageBlob = ImageFactory.imageAsCropped(
                            imageBlob, { width: imageBlob.height, height: imageBlob.height });
                    }
                } else {
                    if (OS_IOS) {
                        imageBlob = imageBlob.imageAsCropped({
                            width: imageBlob.width,
                            height: imageBlob.width
                        });
                    } else {
                        imageBlob = ImageFactory.imageAsCropped(
                            imageBlob, { width: imageBlob.width, height: imageBlob.width });
                    }
                }
                Ti.API.debug('IMAGE CROPED = ' + imageBlob.width + '/' + imageBlob.height);
            }
        }

        // イベント発行
        _.defer(function() {
            self.trigger('selectimage', {image: imageBlob});
        });
    }

    return self;
}

exports.create = PhotoControl;
