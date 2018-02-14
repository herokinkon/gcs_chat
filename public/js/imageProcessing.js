// Insert Image Handler
function insertImage() {
    var isuploadChecked = document.getElementById('optUploadImg').checked;
    if (isuploadChecked) {
        var imgUpload = $('#imgUploadTextBox').val();
        if (imgUpload != '') {
            var file = $('#imgUploadTextBox')[0].files[0]
            uploadImage(file);
            $('#imgUploadTextBox').val('');
            $('#inserImgModal').modal('hide');
        }
    } else {
        var imgLink = $('#imgLinkTextbox').val();

        if (imgLink != '') {
            insertImageViaLink(imgLink);

            // Clear text 
            $('#imgLinkTextbox').val('');
            $('#inserImgModal').modal('hide');
        }
    }
}

// Insert Image Message Via Link.
function insertImageViaLink(imgLink) {
    var img = new Image();
    // Check image size
    img.onload = function () {
        var wid = 640;
        if (this.width < 640) {
            wid = this.width;
        }
        var hei = 640;
        if (this.height < 640) {
            hei = this.height;
        }
        // Encapsulate Image tag
        msg = '<img class="mr-3" src="' + imgLink + '" alt="" width="' + this.width + '" height="' + this.height + '">';
        // Send message to server
        var user = document.getElementById('user').value;
        socket.emit('msg', {
            user: user,
            msg: msg
        });
    };

    // Load image
    img.src = imgLink;
}

// Upload Image from client
function uploadImage(file) {
    var data = new FormData();
    data.append('file', file);

    $.ajax({
        url: '/uploadImage',
        data: data,
        processData: false,
        contentType: false,
        type: 'POST',
        success: function (data) {
            insertImageViaLink(data);
        }
    });
}

// Validate image upload
function validate_fileupload(file) {
    var fileName = file.value;

    var allowed_extensions = ["jpg", "jpeg", "png", "gif", "ico"];
    var file_extension = fileName.split('.').pop().toLowerCase();
    var FileSize = file.files[0].size / 1024 / 1024;
    for (var i = 0; i <= allowed_extensions.length; i++) {
        if (allowed_extensions.indexOf(file_extension) == -1) {
            alert('Invalid File Type');
            document.getElementById('imgUploadTextBox').value = "";
            return;
        }
    }

    if (FileSize > 5) {
        alert('File size doesnot exceed 5MB');
        document.getElementById('imgUploadTextBox').value = "";
    }
}