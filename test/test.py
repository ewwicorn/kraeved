

import magic_hour

client = magic_hour.Client(token="mhk_live_dpulzTGzowilXmZeVQoLG5r4x9wh7WUPT2oPqeAnglzUPa2FBthWCRUkv1771MpnNvsuKIrRJJySlWi3")

response = client.v1.image_to_video.generate(
    assets={"image_file_path": "https://kochevnik.digital/wp-content/uploads/2024/02/plyazh-melasti-bali-819x1024.jpg"},
    end_seconds=3,
    model="ltx-2",
    resolution="480p",
    wait_for_completion=True,
    download_outputs=True,
    download_directory="./output",
    style={"prompt": "static camera, ultrarealistic, waves dribbling"}
)

print(response)
